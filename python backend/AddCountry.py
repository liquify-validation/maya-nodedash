import requests
import json
import time
import math
import datetime
from common import getDB, commitQuery, grabQuery



def countryBack():
    """
    backPort fills in historical database for the churn height passed in

    :param churn: height to grab data for
    """

    response_API = requests.get('https://mayanode.mayachain.info/mayachain/nodes')
    data = json.loads(response_API.text)
    # sanitise data remove any empty elements
    nodes = [x for x in data if '' != x['node_address']]

    # Loop over new nodes and grab IP addr
    for node in nodes:
        if node['ip_address'] != "":
            ipData = grabQuery("SELECT * FROM noderunner.maya_monitor where ip_address='{field}'".format(
                    field=node['ip_address']))

            response_code = 0
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
            node['ip_data']['city'] = ""
            node['ip_data']['isp'] = ""
            node['ip_data']['country'] = ""
            node['ip_data']['countryCode'] = ""

        query = "UPDATE noderunner.maya_monitor SET country = '{country}', country_code = '{country_code}' WHERE " \
                "(node_address = '{node_address}');".format(country=node['ip_data']['country'],country_code=node[
            'ip_data']['countryCode'],node_address=node['node_address'])

        commitQuery(query)

def main():
    countryBack()


if __name__ == "__main__":
    main()