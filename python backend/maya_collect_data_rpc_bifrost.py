import requests
import json
from common import commitQuery, grabQuery
from multiprocessing import Queue

import time
from threading import Thread

def requestThread(data, Queue):
    """
        requestThread thread to grab p2p id and health of a given node
        :param data: node to grab info for
        :param Queue: queue to push output too
    """


    if data['ip_address'] != '':
        bifrostURL = "http://" + data['ip_address'] + ":6040/p2pid"
        healthUrl = "http://" + data['ip_address'] + ":27147/health?"
        bifrost = ""
        health = ""

        try:
            state = requests.get(bifrostURL, timeout=2)
            if state.status_code == 200:
                bifrost = (state.text)
            state = requests.get(healthUrl, timeout=2)
            if state.status_code == 200:
                health = (json.loads(state.text))

            dataReturn = {'node_address': data['node_address'], 'bifrost': bifrost, 'rpc': health,
                          'bifrostURL': bifrostURL, 'healthURL': healthUrl}
            Queue.put(dataReturn)
        except Exception as e:
            return


def biFrostGrabDataAndSaveToDB():
    """
        biFrostGrabDataAndSaveToDB used to update rpc and bifrost info in maya_monitor
    """
    responseQueue = Queue()
    currentDBData = (grabQuery('SELECT * FROM noderunner.maya_monitor'))
    fullAddrList = [x['node_address'] for x in currentDBData]
    currentAddrList = []
    threads = list()
    for node in currentDBData:
        # print("create and start thread ", str(index))
        x = Thread(target=requestThread,
                   args=(node, responseQueue))
        threads.append(x)

    for index, thread in enumerate(threads):
        thread.start()
        if index % 200 == 0:
            time.sleep(2)

    for index, thread in enumerate(threads):
        thread.join()

    while not responseQueue.empty():
        try:
            resp = responseQueue.get()
            currentAddrList.append(resp['node_address'])
            if resp['rpc'] != '' and len(resp['rpc']['result']) == 0:
                query = "UPDATE noderunner.maya_monitor SET " \
                        "rpc = '{rpc}', bifrost = '{bifrost}' " \
                        "WHERE (node_address = '{address}');".format(rpc=json.dumps(resp['rpc']),bifrost=resp['bifrost'],address=resp['node_address'])

                commitQuery(query)
            else:
                #rpc has an error so report as bad
                query = "UPDATE noderunner.maya_monitor SET " \
                        "rpc = '{rpc}', bifrost = '{bifrost}' " \
                        "WHERE (node_address = '{address}');".format(rpc="null", bifrost=resp['bifrost'],
                                                                     address=resp['node_address'])

                commitQuery(query)

            if resp['bifrost'] == '':
                query = "UPDATE noderunner.maya_monitor SET " \
                        "bifrost = '{bifrost}' " \
                        "WHERE (node_address = '{address}');".format(bifrost="null",
                                                                     address=resp['node_address'])

                commitQuery(query)

        except Exception as e:
            print(e)

    # Collect a list of all node which have been missed in the queue, this indicates that there were errors pulling the data
    # inside the thread so report any missing as null
    newList = list(set(fullAddrList).symmetric_difference(set(currentAddrList)))

    for node in newList:
        query = "UPDATE noderunner.maya_monitor SET " \
                "rpc = '{rpc}', bifrost = '{bifrost}' " \
                "WHERE (node_address = '{address}');".format(rpc="null", bifrost="null",
                                                             address=node)

        commitQuery(query)