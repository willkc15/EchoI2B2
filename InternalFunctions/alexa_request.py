import pymysql
import requests
import xml.etree.ElementTree as ET
import json
import smtplib
import random
import difflib


def get_query():

    with open('config.json', 'r') as f:
        config = json.load(f)

    conn = pymysql.connect(host=config['dbHost'],
                           user=config['dbUser'],
                           password=config['dbPassword'],
                           db=config['dbName'])
    try:

        # Grabs the query that has been in db the longest
        with conn.cursor() as cursor:
            sql = 'SELECT * FROM querys ORDER BY id LIMIT 1'
            cursor.execute(sql)
            data = cursor.fetchone()
            query = data[0]
            id_to_delete = str(data[3])
            print("Query: " + query)
            print("ID: " + id_to_delete)
            cursor.close()

        # Deletes the query from the db
        with conn.cursor() as cursor:
            sql = 'DELETE FROM querys where id=' + id_to_delete
            cursor.execute(sql)
            conn.commit()
            cursor.close()

    finally:
        conn.close()
        return query


def get_session_key():

    # XML string used to interact with i2b2 API, will use an xml string like this for every i2b2 call
    ### Currently using demo username and password, will need to come back to this when we get into authentication
    xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <i2b2:request xmlns:i2b2="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:pm="http://www.i2b2.org/xsd/cell/pm/1.1/">
        <message_header>
            <proxy>
                <redirect_url>http://brsadata01pv:9090/i2b2/services/PMService/getServices</redirect_url>
            </proxy>

            <i2b2_version_compatible>1.1</i2b2_version_compatible>
            <hl7_version_compatible>2.4</hl7_version_compatible>
            <sending_application>
                <application_name>i2b2 Project Management</application_name>
                <application_version>1.6</application_version>
            </sending_application>
            <sending_facility>
                <facility_name>i2b2 Hive</facility_name>
            </sending_facility>
            <receiving_application>
                <application_name>Project Management Cell</application_name>
                <application_version>1.6</application_version>
            </receiving_application>
            <receiving_facility>
                <facility_name>i2b2 Hive</facility_name>
            </receiving_facility>
            <datetime_of_message>2018-07-03T15:38:55-04:00</datetime_of_message>
                                    <security>
                                                    <domain>i2b2demo</domain>
                                                    <username>demo</username>
                                                    <password>demouser</password>
                                    </security>
            <message_control_id>
                <message_num>jFymL84vZ75999jaS9IYH</message_num>
                <instance_num>0</instance_num>
            </message_control_id>
            <processing_id>
                <processing_id>P</processing_id>
                <processing_mode>I</processing_mode>
            </processing_id>
            <accept_acknowledgement_type>AL</accept_acknowledgement_type>
            <application_acknowledgement_type>AL</application_acknowledgement_type>
            <country_code>US</country_code>
            <project_id>undefined</project_id>
        </message_header>
        <request_header>
            <result_waittime_ms>180000</result_waittime_ms>
        </request_header>
        <message_body>
            <pm:get_user_configuration>
                <project>undefined</project>
            </pm:get_user_configuration>
        </message_body>
    </i2b2:request> """

    # Stores xml response in xml file, similar files for each function which calls I2B2
    resp = requests.post('http://brsadata01pv:909/i2b2-webclient/index.php', data=xml)
    with open('login.xml', 'wb') as f:
        f.write(resp.content)

    # Have to pass namespaces as argument to dom as it does not recognize them by default
    namespaces = {'ns2': 'http://www.i2b2.org/xsd/hive/msg/1.1/', 'ns4': 'http://www.i2b2.org/xsd/cell/pm/1.1/',
                  'ns3': 'http://www.i2b2.org/xsd/hive/msg/version/'}
    dom = ET.parse('login.xml')
    data = dom.findall('message_body/ns4:configure/user', namespaces)
    session_key = None  # Declared here for scope reasons
    for d in data:
        session_key = d.find('password').text
    return session_key


def get_categories(session_key):

    xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <ns3:request xmlns:ns3="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:ns4="http://www.i2b2.org/xsd/cell/ont/1.1/" xmlns:ns2="http://www.i2b2.org/xsd/hive/plugin/">
        <message_header>
            <proxy>
                <redirect_url>http://brsadata01pv:9090/i2b2/services/OntologyService/getCategories</redirect_url>
            </proxy>
    
            <i2b2_version_compatible>1.1</i2b2_version_compatible>
            <hl7_version_compatible>2.4</hl7_version_compatible>
            <sending_application>
                <application_name>i2b2 Ontology</application_name>
                <application_version>1.6</application_version>
            </sending_application>
            <sending_facility>
                <facility_name>i2b2 Hive</facility_name>
            </sending_facility>
            <receiving_application>
                <application_name>Ontology Cell</application_name>
                <application_version>1.6</application_version>
            </receiving_application>
            <receiving_facility>
                <facility_name>i2b2 Hive</facility_name>
            </receiving_facility>
            <datetime_of_message>2018-07-12T16:10:29-04:00</datetime_of_message>
                                    <security>
                                                    <domain>i2b2demo</domain>
                                                    <username>demo</username>
                                                    <password is_token="true" token_ms_timeout="1800000">""" + session_key + """</password>
                                    </security>
            <message_control_id>
                <message_num>6O67XVpM9Kvk0n330Lequ</message_num>
                <instance_num>0</instance_num>
            </message_control_id>
            <processing_id>
                <processing_id>P</processing_id>
                <processing_mode>I</processing_mode>
            </processing_id>
            <accept_acknowledgement_type>AL</accept_acknowledgement_type>
            <application_acknowledgement_type>AL</application_acknowledgement_type>
            <country_code>US</country_code>
            <project_id>Demo</project_id>
        </message_header>
        <request_header>
            <result_waittime_ms>180000</result_waittime_ms>
        </request_header>
        <message_body>
          <ns4:get_categories  synonyms="true" hiddens="false" type="core"/>
        </message_body>
    </ns3:request>"""

    resp = requests.post('http://brsadata01pv:909/i2b2-webclient/index.php', data=xml)
    with open('categories.xml', 'wb') as f:
        f.write(resp.content)

    namespaces = {'ns5': "http://www.i2b2.org/xsd/hive/msg/1.1/", 'ns6': "http://www.i2b2.org/xsd/cell/ont/1.1/"}
    dom = ET.parse('categories.xml')
    data = dom.findall('message_body/ns6:concepts/concept', namespaces)

    key_strings = []  # Declared here for scope reasons
    for d in data:
        item = d.find('key').text
        key_strings.append(item)

    # Formats and stores categories in list to return
    categories = []
    for cat in key_strings:
        item = cat.split('\\')
        categories.append(item[2])
    return categories


def get_search_keys(session_key, query, categories):

    search_keys = []  # Declared here for scope reasons
    # We must search through each category as there is no 'all category' option
    for cat in categories:
        xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <ns3:request xmlns:ns3="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:ns4="http://www.i2b2.org/xsd/cell/ont/1.1/" xmlns:ns2="http://www.i2b2.org/xsd/hive/plugin/">
            <message_header>
                <proxy>
                    <redirect_url>http://brsadata01pv:9090/i2b2/services/OntologyService/getNameInfo</redirect_url>
                </proxy>
        
                <i2b2_version_compatible>1.1</i2b2_version_compatible>
                <hl7_version_compatible>2.4</hl7_version_compatible>
                <sending_application>
                    <application_name>i2b2 Ontology</application_name>
                    <application_version>1.6</application_version>
                </sending_application>
                <sending_facility>
                    <facility_name>i2b2 Hive</facility_name>
                </sending_facility>
                <receiving_application>
                    <application_name>Ontology Cell</application_name>
                    <application_version>1.6</application_version>
                </receiving_application>
                <receiving_facility>
                    <facility_name>i2b2 Hive</facility_name>
                </receiving_facility>
                <datetime_of_message>2018-07-12T09:01:10-04:00</datetime_of_message>
                                        <security>
                                                        <domain>i2b2demo</domain>
                                                        <username>demo</username>
                                                        <password is_token="true" token_ms_timeout="1800000">""" + session_key + """</password>
                                        </security>
                <message_control_id>
                    <message_num>rHvQx1vX2Fb8r9grjy8MZ</message_num>
                    <instance_num>0</instance_num>
                </message_control_id>
                <processing_id>
                    <processing_id>P</processing_id>
                    <processing_mode>I</processing_mode>
                </processing_id>
                <accept_acknowledgement_type>AL</accept_acknowledgement_type>
                <application_acknowledgement_type>AL</application_acknowledgement_type>
                <country_code>US</country_code>
                <project_id>Demo</project_id>
            </message_header>
            <request_header>
                <result_waittime_ms>180000</result_waittime_ms>
            </request_header>
            <message_body>
                <ns4:get_name_info blob="true" type="core" max='200'  hiddens="false" synonyms="true" category=\"""" + cat + """\">
                    <match_str strategy="contains">""" + query + """</match_str>
                </ns4:get_name_info>
            </message_body>
        </ns3:request>"""

        resp = requests.post('http://brsadata01pv:909/i2b2-webclient/index.php', data=xml)
        # Will store each category's search keys temporarily but after function is executed, file will only have the last category
        with open('search_keys.xml', 'wb') as f:
            f.write(resp.content)

        namespaces = {'ns5': 'http://www.i2b2.org/xsd/hive/msg/1.1/', 'ns6': 'http://www.i2b2.org/xsd/cell/ont/1.1/'}
        dom = ET.parse('search_keys.xml')
        data = dom.findall('message_body/ns6:concepts/concept', namespaces)
        ### For now assign a random totalnum value, will need to pull real value once connected to actual I2B2
        for d in data:
            key = d.find('key').text
            total_num = d.find('totalnum').text
            if total_num is None:
                total_num = random.randint(0, 11)
            set_pair = [key, int(total_num)]
            search_keys.append(set_pair)
    # We return a list of lists each storing a key and a totalnum value
    return search_keys


def find_best(search_keys, query):

    max_num = 0
    best_key = ''
    # We choose the best key based on totalnum and use pythons levenshtein algorithm as a tiebreak
    for item in search_keys:
        if item[1] > max_num:
            max_num = item[1]
            best_key = item[0]
        elif item[1] == max_num:
            sequence = difflib.SequenceMatcher(isjunk=None, a=item[0], b=query)
            similarity_competitor = round(sequence.ratio() * 100, 1)
            sequence = difflib.SequenceMatcher(isjunk=None, a=best_key, b=query)
            similarity_leader = round(sequence.ratio() * 100, 1)
            if similarity_competitor > similarity_leader:
                best_key = item[0]
    return best_key


def get_i2b2_result(session_key, best_key):

    xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <ns6:request xmlns:ns4="http://www.i2b2.org/xsd/cell/crc/psm/1.1/" xmlns:ns7="http://www.i2b2.org/xsd/cell/ont/1.1/" xmlns:ns3="http://www.i2b2.org/xsd/cell/crc/pdo/1.1/" xmlns:ns5="http://www.i2b2.org/xsd/hive/plugin/" xmlns:ns2="http://www.i2b2.org/xsd/hive/pdo/1.1/" xmlns:ns6="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:ns8="http://www.i2b2.org/xsd/cell/crc/psm/querydefinition/1.1/">
        <message_header>
            <proxy>
                <redirect_url>http://brsadata01pv:9090/i2b2/services/QueryToolService/request</redirect_url>
            </proxy>
    
            <sending_application>
                <application_name>i2b2_QueryTool</application_name>
                <application_version>1.6</application_version>
            </sending_application>
            <sending_facility>
                <facility_name>PHS</facility_name>
            </sending_facility>
            <receiving_application>
                <application_name>i2b2_DataRepositoryCell</application_name>
                <application_version>1.6</application_version>
            </receiving_application>
            <receiving_facility>
                <facility_name>PHS</facility_name>
            </receiving_facility>
            <security>
                <domain>i2b2demo</domain>
                <username>demo</username>
                <password is_token="true" token_ms_timeout="1800000">""" + session_key + """</password>
            </security>
            <message_type>
                <message_code>Q04</message_code>
                <event_type>EQQ</event_type>
            </message_type>
            <message_control_id>
                <message_num>g5PzP1I7EaS6fwRJ7H7PN</message_num>
                <instance_num>0</instance_num>
            </message_control_id>
            <processing_id>
                <processing_id>P</processing_id>
                <processing_mode>I</processing_mode>
            </processing_id>
            <accept_acknowledgement_type>messageId</accept_acknowledgement_type>
            <project_id>Demo</project_id>
        </message_header>
        <request_header>
            <result_waittime_ms>180000</result_waittime_ms>
        </request_header>
        <message_body>
            <ns4:psmheader>
                <user group="Demo" login="demo">demo</user>
                <patient_set_limit>0</patient_set_limit>
                <estimated_time>0</estimated_time>
                <query_mode>optimize_without_temp_table</query_mode>
                <request_type>CRC_QRY_runQueryInstance_fromQueryDefinition</request_type>
            </ns4:psmheader>
            <ns4:request xsi:type="ns4:query_definition_requestType" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
                <query_definition>
        <query_name>N/A</query_name>
        <query_timing>ANY</query_timing>
        <specificity_scale>0</specificity_scale>
        <panel>
            <panel_number>1</panel_number>
            <panel_accuracy_scale>100</panel_accuracy_scale>
            <invert>0</invert>
            <panel_timing>ANY</panel_timing>
            <total_item_occurrences>1</total_item_occurrences>
            <item>
                <hlevel>6</hlevel>
                <item_name>N/A</item_name>
                <item_key>""" + best_key + """
    </item_key>
                <tooltip>N/A</tooltip>
                <class>ENC</class>
                <item_icon>LA</item_icon>
                <item_is_synonym>false</item_is_synonym>
            </item>
        </panel>
    </query_definition>
    
                <result_output_list><result_output priority_index="19" name="patient_count_xml"/>
    </result_output_list>
    
            </ns4:request>
            
        </message_body>
    </ns6:request>"""

    resp = requests.post('http://brsadata01pv:909/i2b2-webclient/index.php', data=xml)
    with open('results.xml', 'wb') as f:
        f.write(resp.content)

    namespaces = {'ns5': 'http://www.i2b2.org/xsd/hive/msg/1.1/', 'ns4': "http://www.i2b2.org/xsd/cell/crc/psm/1.1/"}
    dom = ET.parse('results.xml')
    data = dom.findall('message_body/ns4:response/query_result_instance', namespaces)
    result = None
    for d in data:
        result = d.find('set_size').text
    return result


def send_email(query, best_key, result):

    try:
        with open('config.json', 'r') as f:
            config = json.load(f)
        server = smtplib.SMTP('smtp.gmail.com:587')
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(config['emailAddress'], config['password'])
        ### Eventually want to have users email address passed to use here from Alexa skill
        to_address = 'kelton.c.williams@gmail.com'
        # Must start message string with newline otherwise email body will be empty
        message = '\nHello, this is Alexa with I2B2. We have located the data you requested:\nYou wanted us to query i2b2 for the phrase:' \
                  '\ ' + query + '.\nGiven this information we ran a query on the following: ' + best_key + '\nWe found this data set to have set size of: ' + result + '.'
        print(message)
        server.sendmail(config['emailAddress'], to_address, message)
        server.quit()
        print('Email sent successfully!')
    except:
        print('Email failed to send!')


def main():
    ### query = get_query()
    # Currently setting default query as application is not live yet
    query = 'circulatory'
    print(query)
    # Gets session key necessary for each request we make to I2B2
    session_key = get_session_key()
    print(session_key)
    # Need categories of data to search through each one for our requested data, no 'all' category option
    categories = get_categories(session_key)
    print(categories)
    # Returns necessary key information as well as totalnum as a list of lists
    search_keys = get_search_keys(session_key, query, categories)
    # Check whether or not requested data exists
    if search_keys:
        print(search_keys)
        best_key = find_best(search_keys, query)
        print(best_key)
        # Finally gets the desired data, which as of now is the set size
        result = get_i2b2_result(session_key, best_key)
        print(result)
        send_email(query, best_key, result)
    else:
        print("Could not find requested data")


main()
