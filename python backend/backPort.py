import requests
import json
import time
import math
import datetime
from common import getDB, commitQuery, grabQuery

def backPortGlobal(churn):
    entries = len(grabQuery("SELECT * FROM noderunner.maya_monitor_global_historic where churnHeight='{field}'".format(
        field=churn)))

    if (entries != 0):
        return

    data = grabQuery("SELECT * FROM noderunner.maya_monitor_historic where status='Active' AND churnHeight='{field}' ORDER BY bond ASC".format(
        field=churn))

    if(len(data) == 0):
        return

    position = math.ceil((len(data) + 1) * 2 / 3)
    maxBond = data[position]['bond']

    totalBond = 0

    for node in data:
        totalBond += node['bond']

    query = "INSERT INTO noderunner.maya_monitor_global_historic (churnHeight, maxEffectiveStake, totalBondedRune) " \
            "VALUES ('{churnHeight}', '{maxEffectiveStake}', '{totalBondedRune}')".format(churnHeight=churn,
                                                                                          maxEffectiveStake=maxBond,
                                                                                          totalBondedRune=totalBond)

    commitQuery(query)

def backPort(churn):
    """
    backPort fills in historical database for the churn height passed in

    :param churn: height to grab data for
    """

    entries = len(grabQuery("SELECT * FROM noderunner.maya_monitor_historic where churnHeight='{field}'".format(
        field=churn)))

    if(entries != 0):
        return

    status = 0
    while status != 200:
        print("trying " + str(churn))
        response_API = requests.get('https://mayanode.mayachain.info/mayachain/nodes?height=' + str(churn))
        status = response_API.status_code

    data = json.loads(response_API.text)
    # sanitise data remove any empty elements
    nodes = [x for x in data if '' != x['node_address']]

    # Loop over new nodes and grab IP addr
    for node in nodes:
        if node['ip_address'] != "":
            ipData = grabQuery("SELECT * FROM noderunner.maya_monitor_historic where ip_address='{field}'".format(
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
            else:
                node['ip_data'] = {}
                node['ip_data']['city'] = ipData[0]['location']
                node['ip_data']['isp'] = ipData[0]['isp']

        else:
            node['ip_data'] = {}
            node['ip_data']['city'] = ""
            node['ip_data']['isp'] = ""

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
                                      bond_providers=json.dumps(node['bond_providers']), bond=int(node['bond']),
                                      current_award=int(node['reward']), slash_points=node['slash_points'],
                                      forced_to_leave=int(node['forced_to_leave']),
                                      requested_to_leave=int(node['requested_to_leave']), bond_address='',
                                      preflight_status=json.dumps(node['preflight_status']), status=node['status'],
                                      status_since=node['status_since'], version=node['version'], churnHeight=churn)

        commitQuery(query)

def main():
    response_API = requests.get('https://midgard.mayachain.info/v2/churns')
    data = json.loads(response_API.text)


    for key in data:
        backPort(int(key['height']) - 1)
        backPortGlobal(int(key['height']) - 1)



if __name__ == "__main__":
    main()