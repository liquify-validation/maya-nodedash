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

    test = 1

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


    test = 1



def main():
    churns = grabQuery(
        "SELECT DISTINCT churnHeight FROM noderunner.maya_monitor_historic ORDER BY churnHeight DESC")

    for churn in churns:
        fillMax(churn['churnHeight'])
        positionFiller(churn['churnHeight'])
        test = 1


if __name__ == "__main__":
    main()