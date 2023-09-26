import requests
import json
import time
import math
import datetime
from common import getDB, commitQuery, grabQuery


def positionFiller(churn):
    """
    backPort fills in historical database for the churn height passed in

    :param churn: height to grab data for
    """
    data = grabQuery(
        "SELECT * FROM noderunner.maya_monitor_historic WHERE churnHeight='{field}' AND status='Active' ORDER BY slash_points ASC".format(
            field=churn))

    itr = 1
    for key in data:
        query = "UPDATE noderunner.maya_monitor_historic SET " \
                "position = '{position}' " \
                "WHERE (node_address = '{node_address}' AND churnHeight = '{height}');".format(
            position=itr,
            node_address=key['node_address'],
            height=churn)
        commitQuery(query)

        itr+=1

def fillMax(churn):
    """
    backPort fills in historical database for the churn height passed in

    :param churn: height to grab data for
    """
    data = grabQuery(
        "SELECT * FROM noderunner.maya_monitor_historic WHERE churnHeight='{field}' ORDER BY slash_points ASC".format(
            field=churn))

    number = grabQuery(
        "SELECT COUNT(*) FROM noderunner.maya_monitor_historic WHERE churnHeight='{height}' AND status='Active'".format(
            height=churn
        ))[0]['COUNT(*)']

    itr = 1
    query = "UPDATE noderunner.maya_monitor_historic SET " \
            "maxNodes = '{maxNodes}' " \
            "WHERE (churnHeight = '{height}');".format(
        maxNodes=number,
        height=churn)
    commitQuery(query)

def checkIfNewChurn():
    """
    checkIfNewChurn has a look if we have just passed a churn, if so it fills in the historical DB
    """
    lastChurn = (grabQuery('SELECT lastChurn FROM noderunner.maya_monitor_global'))[0]['lastChurn'] - 1

    entries = len(grabQuery("SELECT * FROM noderunner.maya_monitor_historic where churnHeight='{field}'".format(
        field=lastChurn)))

    if(entries != 0):
        return

    response_API = requests.get('https://mayanode.mayachain.info/mayachain/nodes?height=' + str(lastChurn))
    data = json.loads(response_API.text)
    # sanitise data remove any empty elements
    nodes = [x for x in data if '' != x['node_address']]

    # Loop over new nodes and grab IP addr
    for node in nodes:
        if node['ip_address'] != "":
            ipData = grabQuery("SELECT * FROM noderunner.maya_monitor where ip_address='{field}'".format(
                field=node['ip_address']))

            response_code = 0
            if(len(ipData) == 0):
                while response_code != 200:
                    response = requests.get("http://ip-api.com/json/" + node['ip_address'])
                    response_code = response.status_code
                    if response_code == 429:
                        print("rate limited wait 60seconds")
                        time.sleep(60)
                    elif response_code == 200:
                        ip_data = json.loads(response.text)
                        if (ip_data['status'] != "fail"):
                            node['ip_data'] = ip_data
                        else:
                            node['ip_data'] = {}
                            node['ip_data']['city'] = ""
                            node['ip_data']['isp'] = ""
                            node['ip_data']['country'] = ""
                            node['ip_data']['countryCode'] = ""

            else:
                node['ip_data'] = {}
                node['ip_data']['city'] = ipData[0]['location']
                node['ip_data']['isp'] = ipData[0]['isp']
                node['ip_data']['country'] = ipData[0]['country']
                node['ip_data']['countryCode'] = ipData[0]['countryCode']
        else:
            node['ip_data'] = {}
            node['ip_data']['city'] = ""
            node['ip_data']['isp'] = ""
            node['ip_data']['country'] = ""
            node['ip_data']['countryCode'] = ""

        query = "INSERT INTO noderunner.maya_monitor_historic (node_address, ip_address, location, isp, " \
                "active_block_height, bond_providers, bond, current_award, slash_points,forced_to_leave, " \
                "requested_to_leave, bond_address, preflight_status, status, " \
                "status_since, version, churnHeight) VALUES ('{node_address}', '{ip_address}','{city}','{isp}'," \
                "'{active_block_height}','{bond_providers}','{bond}','{current_award}','{slash_points}'," \
                "'{forced_to_leave}','{requested_to_leave}','{bond_address}'," \
                "'{preflight_status}','{status}','{status_since}'," \
                "'{version}','{churnHeight}')".format(node_address=node['node_address'], ip_address=node['ip_address'],
                                      city=node['ip_data']['city'], isp=node['ip_data']['isp'],
                                      active_block_height=node['active_block_height'],
                                      bond_providers=json.dumps(node['bond_providers']), bond=int(node['total_bond']),
                                      current_award=int(node['current_award']), slash_points=node['slash_points'],
                                      forced_to_leave=int(node['forced_to_leave']),
                                      requested_to_leave=int(node['requested_to_leave']), bond_address='',
                                      preflight_status=json.dumps(node['preflight_status']), status=node['status'],
                                      status_since=node['status_since'], version=node['version'], churnHeight=lastChurn)

        commitQuery(query)
    positionFiller(lastChurn)
    fillMax(lastChurn)


