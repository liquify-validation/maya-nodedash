import time

import requests
import json
from common import grabQuery, commitQuery

def updateIPs():
    """
    updateIPs looks to see if IPs on chain don't match what is in the DB, if they don't match pull location and isp
    info and update the db
    """
    currentDBData = (grabQuery('SELECT * FROM noderunner.maya_monitor'))
    # build IP table
    ipTableOld = {}
    for node in currentDBData:
        ipTableOld[node['node_address']] = node['ip_address']


    response_API = requests.get('https://mayanode.mayachain.info/mayachain/nodes')
    newData = json.loads(response_API.text)
    ipTableNew = {}
    for node in newData:
        ipTableNew[node['node_address']] = node['ip_address']

    #check for any missmatches
    mismatch = {}
    for key in ipTableNew:
        if key in ipTableOld:
            if ipTableNew[key] != ipTableOld[key]:
                mismatch[key] = ipTableNew[key]

    for key in mismatch:
        if mismatch[key] != "":
            response_code = 0
            while response_code != 200:
                response = requests.get("http://ip-api.com/json/" + mismatch[key])
                response_code = response.status_code
                if response_code == 429:
                    print("rate limited wait 60seconds")
                    time.sleep(60)
                elif response_code == 200:
                    ip_data = json.loads(response.text)
                    if(ip_data['status'] != "fail"):
                        query = "UPDATE noderunner.maya_monitor SET ip_address = '{ip}', location = '{city}', " \
                                "isp = '{isp}' WHERE node_address = '{node_address}' ".format(ip=mismatch[key],city=ip_data['city'],isp=ip_data['isp'],node_address=key)
                    else:
                        query = "UPDATE noderunner.maya_monitor SET ip_address = '{ip}', location = '{city}', " \
                                "isp = '{isp}' WHERE node_address = '{node_address}' ".format(ip=mismatch[key],city="",isp="",node_address=key)

                    commitQuery(query)
