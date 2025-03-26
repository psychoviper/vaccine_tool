import os
import math
import aiohttp
import aiofiles
import pandas as pd
from celery import Celery
import re
from multidict import MultiDict
from bs4 import BeautifulSoup
# from gevent import monkey
import asyncio
from celery import group
import time
from quart import jsonify


# Initialize Celery
celery = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)
celery.conf.update(task_serializer="json")

async def filtering(input_csv, output_csv, cond=True):
    df = pd.read_csv(input_csv)
    # Apply the filter conditions
    if cond:
        filtered_df = df[
            (df['Allergen Test'] == 'Non-Allergen') & 
            (df['Antigen Test'] == 'Pending') & #change this after proper implementation of antigen-test (vaxijen)
            (df['Signal P'] == 'Found')
        ]
    else:
        filtered_df = df[
            (df['Allergen Test'] == 'Non-Allergen') & 
            (df['Toxicity Test']=='Non-Toxin') &
            (df['Antigen Test'] == 'Pending')#change this after proper implementation of antigen-test (vaxijen)
        ]
    # Save the filtered data to a new CSV file
    filtered_df.to_csv(output_csv, index=False)
    print(f"Filtered data has been saved to {output_csv}")

# -------------------------- BATCH PROCESSING FOR SEQUENCES FUNCTION ---------------------------#
@celery.task
def batch_processing(input_file, selected_value, user_id, total_sequences=None):
    print("Breaks input FASTA file into batches and processes them asynchronously")
    
    df = pd.read_csv(input_file)
    max_sequences = len(df)
    if total_sequences is None or total_sequences > max_sequences:
        total_sequences = max_sequences

    batch_size = 500  # Adjust batch size based on performance
    num_batches = math.ceil(total_sequences / batch_size)
    print(f"\nProcessing {total_sequences} sequences in {num_batches} batches.")

    dir_path = f"user_data/{user_id}"
    os.makedirs(dir_path, exist_ok=True)

    # API URLs
    url_allergen = "https://webs.iiitd.edu.in/raghava/algpred2/batch_action.php"
    url_signalP = "https://phobius.sbc.su.se/cgi-bin/predict.pl"
    url_antigen = ""  # Replace with actual API

    async def process_all_batches():
        tasks = []
        for batch_start in range(0, total_sequences, batch_size):
            batch_index = batch_start // batch_size
            batch = df.iloc[batch_start:min(batch_start + batch_size, total_sequences)]
            batch_fasta_path = f"{dir_path}/batch_{batch_index + 1}.fa"

            with open(batch_fasta_path, 'w') as f:
                for _, row in batch.iterrows():
                    f.write(f">Protein_{row['Protein ID']}\n{row['Sequence']}\n")

            tasks.append(scrape_all_tools(len(batch), batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, total_sequences, dir_path, input_file))

        await asyncio.gather(*tasks)

    asyncio.run(process_all_batches())

# @celery.task
# def batch_processing(input_file, selected_value, user_id, total_sequences=None):
#     print("Breaks input FASTA file into batches and processes them asynchronously")
#     df = pd.read_csv(input_file)

#     max_sequences = len(df)
#     if total_sequences is None or total_sequences > max_sequences:
#         total_sequences = max_sequences

#     batch_size = 500  # Adjust batch size based on performance
#     num_batches = math.ceil(total_sequences / batch_size)
#     print(f"\nProcessing {total_sequences} sequences in {num_batches} batches.")

#     dir_path = f"user_data/{user_id}"
#     os.makedirs(dir_path, exist_ok=True)

#     # API URLs
#     url_allergen = "https://webs.iiitd.edu.in/raghava/algpred2/batch_action.php"
#     url_signalP = "https://phobius.sbc.su.se/cgi-bin/predict.pl"
#     url_antigen = ""  # Replace with actual API

#     # Run batches asynchronously
#     batch_tasks = []
#     for batch_start in range(0, total_sequences, batch_size):
#         batch_index = batch_start // batch_size
#         batch = df.iloc[batch_start:min(batch_start + batch_size, total_sequences)]
#         batch_fasta_path = f"{dir_path}/batch_{batch_index + 1}.fa"

#         with open(batch_fasta_path, 'w') as f:
#             for _, row in batch.iterrows():
#                 f.write(f">Protein_{row['Protein ID']}\n{row['Sequence']}\n")
#         batch_tasks.append(
#             process_batch.s(len(batch), batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, total_sequences,dir_path,input_file)
#         )

#     # Start tasks concurrently
#     job = group(batch_tasks)()
#     return job.id  # Return Celery task ID
# # ----------------------------------||--------------------------------------------------
# # -------------------------- ASYNC BATCH PROCESSING ---------------------------#
# @celery.task
# def process_batch(batch, batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, total_sequences,dir_path,input_file):
#     print("Processes a single batch asynchronously")
#     return asyncio.run(
#         scrape_all_tools(batch, batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, total_sequences, dir_path, input_file)
#     )
# ----------------------------------||--------------------------------------------------
async def scrape_all_tools(batch, batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, total_sequences,dir_path,input_file):
    print("Scrapes antigenicity, allergenicity, and SignalP tools concurrently")
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_allergen(session, batch, batch_index, batch_fasta_path, url_allergen, selected_value),
            scrape_signalP(session, batch, batch_index, batch_fasta_path, url_signalP),
            scrape_antigen(session, batch, batch_index, batch_fasta_path, url_antigen),
        ]
        results = await asyncio.gather(*tasks)
    df = pd.read_csv(input_file)
    for result, batch_index, col in results:
        batch_start = batch_index * batch
        for i, row_index in enumerate(range(batch_start, min(batch_start + batch, total_sequences))):
            df.at[row_index, col] = result[i]

        batch_fasta_path = f"{dir_path}/batch_{batch_index + 1}.fa"
        if os.path.exists(batch_fasta_path):
            os.remove(batch_fasta_path)

    df.to_csv(input_file, index=False)
    print("All batches processed. Results saved.")

    # return jsonify({'data': f"success.{session['user_id']}"})
    return results

# -------------------------- BATCH-2 PROCESSING FUNCTION ---------------------------#
@celery.task(queue="sequential_queue")  
def batch2_processing(input_file, path, user_id, values):
    return asyncio.run(
        scrape_all_epitopes(input_file, path, user_id, values)
    ) 
# ----------------------------------||--------------------------------------------------
async def scrape_all_epitopes(input_file, path, user_id, values):
    bCell_FileName=user_id+'_bCell.csv'
    ctl_FileName=user_id+'_ctl.csv'
    ht_FileName=user_id+'_ht.csv'
    ifn_FileName=user_id+'_ifn.csv'
    bCell_csv=os.path.join(path, bCell_FileName)
    ctl_csv=os.path.join(path, ctl_FileName)
    ht_csv=os.path.join(path, ht_FileName)
    ifn_csv=os.path.join(path, ifn_FileName)
    # print(bCell_csv)
    df = pd.read_csv(input_file)
    # print(df)
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_bcell_epitope(session, df, bCell_csv, values[0], values[1]),
            scrape_ctl_epitope(session, df, ctl_csv, values[2], values[3], values[4], values[5]),
            scrape_ht_epitope(session, df, ht_csv, values[6], values[7], values[8], values[9], values[10]),
            scrape_ifn_epitope(session, df, ifn_csv, values[11], values[12], values[13], values[14]),
        ]
        results = await asyncio.gather(*tasks)
    return results


@celery.task
def process_epitope_batch(user_id,bcell_csv, ctl_csv, th_csv, th_ifn, selected_value=0.51):
    return asyncio.run(
        process_all_epitopes(user_id, bcell_csv, ctl_csv, th_csv, th_ifn, selected_value)
    ) 
# ----------------------------------||--------------------------------------------------
# -------------------------- ASYNC Epitope Batch PROCESSING ---------------------------#
async def process_all_epitopes(user_id, bcell_csv, ctl_csv, th_csv, th_ifn, selected_value):
    print("Scrapes antigenicity, toxicity, and Antigenicity concurrently")
    tasks = [
        epitope_processing(bcell_csv, user_id, 'bCell',selected_value),
        epitope_processing(ctl_csv, user_id, 'CTH',selected_value),
        epitope_processing(th_csv, user_id, 'HT',selected_value),
        epitope_processing(th_ifn, user_id, 'IFN',selected_value),
    ]
    results = await asyncio.gather(*tasks)
    return results
# ----------------------------------||--------------------------------------------------
# -------------------------- BATCH PROCESSING FOR SEQUENCES FUNCTION ---------------------------#
async def epitope_processing(input_file, user_id, type, selected_value, total_sequences=None):
    df = pd.read_csv(input_file)
    max_sequences=len(df)
    if total_sequences is None or total_sequences > max_sequences:
        total_sequences = max_sequences
    batch_size = 500
    num_batches = math.ceil(total_sequences / batch_size)
    print(f"\nProcessing {type} {total_sequences} sequences in {num_batches} batches of {batch_size} sequences each.")
    
    # Create a temporary directory
    dir_path = f"user_data/{user_id}"
    os.makedirs(dir_path, exist_ok=True)

    url_allergen = "https://webs.iiitd.edu.in/raghava/algpred2/batch_action.php"
    url_toxicity = "https://webs.iiitd.edu.in/raghava/toxinpred/multiple_test.php"
    url_antigen = ""
    tasks = []
    epitope_counter = 1
    async with aiohttp.ClientSession() as session:
        for batch_start in range(0, total_sequences, batch_size):
            batch_index = batch_start // batch_size
            batch = df.iloc[batch_start:min(batch_start + batch_size, total_sequences)]
            
            batch_fasta_path = f"{dir_path}/{type}_{batch_index + 1}.fa"
            async with aiofiles.open(batch_fasta_path, 'w') as f:
                for _, row in batch.iterrows():
                    await f.write(f">Epitope_{epitope_counter}\n{row['Epitope']}\n")
                    epitope_counter += 1

            tasks.append(asyncio.create_task(scrape_toxicity(session,len(batch), batch_index, batch_fasta_path, url_toxicity)))
            tasks.append(asyncio.create_task(scrape_allergen(session,len(batch), batch_index, batch_fasta_path, url_allergen,selected_value)))
            tasks.append(asyncio.create_task(scrape_antigen(session,len(batch), batch_index, batch_fasta_path, url_antigen)))

        results = await asyncio.gather(*tasks)

    for result, batch_index, col in results:
        batch_start = batch_index * batch_size
        for i, row_index in enumerate(range(batch_start, min(batch_start + batch_size, total_sequences))):
            df.at[row_index, col] = result[i]

        # batch_txt_path = f"{dir_path}/batch_{batch_index + 1}.txt"
        batch_fasta_path = f"{dir_path}/{type}_{batch_index + 1}.fa"
        if os.path.exists(batch_fasta_path):
            os.remove(batch_fasta_path)
        # if os.path.exists(batch_txt_path):
        #     os.remove(batch_txt_path)
    output_file=input_file[:-4]+'filtered.csv'
    # print(results)
    df.to_csv(input_file, index=False)
    print("All batches processed. Results saved[Epitope Processing].")
    # await asyncio.create_task(filtering(input_file,output_file,False))
    return results


# -------------------------- ASYNC SCRAPING FUNCTIONS ---------------------------#
# -------------------------- Antigen Prediction ---------------------------#
async def scrape_allergen(session, batch_length, batch_index, batch_fasta_path, url, selected_value):
    """Scrapes allergenicity tool"""
    print(f"Processing Allergen Batch {batch_index + 1}")
    async with aiofiles.open(batch_fasta_path, 'r') as f:
        fasta_content = await f.read()

    payload = {"name": f"Job_Batch_{batch_index + 1}", "seq": fasta_content, "terminus": 4, "svm_th": float(selected_value)}

    try:
        async with session.post(url, data=payload) as response:
            html = await response.text()
            if response.status == 200:
                soup = BeautifulSoup(html, 'html.parser')
                result_cells = soup.find_all("td")
                results = [result_cells[6 + i * 6].get_text().strip() if i * 6 + 6 < len(result_cells) else "Error" for i in range(batch_length)]
                print(f"Batch {batch_index + 1} of Allergen processed successfully.")
                return (results, batch_index, "Allergen Test")
    except Exception as e:
        print(f"Error in Allergen Batch {batch_index + 1}: {e}")
        return (["Error"] * batch_length, batch_index, "Allergen Test")

# |-----------------------------------Signal Prediction---------------------------|
async def scrape_signalP(session, batch_length, batch_index, batch_fasta_path, url):
    """Scrapes SignalP tool"""
    print(f"Processing SignalP Batch {batch_index + 1}")
    async with aiofiles.open(batch_fasta_path, "rb") as f:
        file_data = await f.read()  # Read file asynchronously

    form_data = aiohttp.FormData()  # Create FormData object
    form_data.add_field("protfile", file_data, filename=batch_fasta_path, content_type="text/plain")  

    payload = {
        # "name": f"Job_Batch_{batch_index + 1}",
        "protseq": "",
        "format": "short",
    }
    # Add additional form fields from payload
    for key, value in payload.items():
        form_data.add_field(key, str(value))
    
    try:
        async with session.post(url, data=form_data) as response:
            html = await response.text()
            if response.status == 200:
                soup = BeautifulSoup(html, 'html.parser')
                # print(soup)
                data = soup.find("pre").get_text()
                # result_cells = soup.find_all("td")
                # Parse results for each sequence
                lines = data.strip().split("\n")[1:]  # Skip the header
                results = ["Found" if re.split(r'\s+', line.strip())[-2]=='Y' else "Not Found" for line in lines ]
                # print(results)
                print(f"Batch {batch_index + 1} of Signal P processed successfully.")
                return (results,batch_index,'Signal P')
            
            else:
                print(f"Batch {batch_index + 1}: Signal P Server returned status {response.status_code}.")
                return (["Network Error"] * batch_length, batch_index,'Signal P')
    except Exception as e:
        print(f"Batch {batch_index + 1}: Signal P Error - {e}")
        return (["Submission Failed"] * batch_length, batch_index,'Signal P')

    # Implement SignalP scraping logic here...
    # return (["SignalP Data"] * batch_length, batch_index, "Signal P")

# |-----------------------------------Toxicity Prediction---------------------------|
async def scrape_toxicity(session, batch_length, batch_index, batch_fasta_path, url):
    # async with aiohttp.ClientSession() as session:
    print(f"Toxicity Batch {batch_index + 1} processing.")
    async with aiofiles.open(batch_fasta_path, "r") as f:
        file_data = await f.read()  # Read file asynchronously
    payload = MultiDict([
        ("seq", file_data),
        ("method", "1"),
        ("eval", "10"),
        ("thval", "0.0"),
        ("field[]", "4"),
        ("field[]", "7"),
        ("field[]", "9"),
        ("field[]", "11"),
        ("field[]", "13"),
    ])
    # async with session.post(url, data=payload,headers=headers) as response:
    async with session.post(url, data=payload) as response:
        html = await response.text()
        # print(html)
        result=[]
        if response.status == 200:
            soup = BeautifulSoup(html, "html.parser")
            meta_refresh = soup.find("meta", attrs={"http-equiv": "refresh"})
            if meta_refresh:
                # Extract the URL from the content attribute
                refresh_url = meta_refresh["content"].split("url=")[-1]
                final_url = f"https://webs.iiitd.edu.in/raghava/toxinpred/{refresh_url}"
                # print(final_url)
                # Step 3: Send a GET request to the redirected URL
                final_response = await session.get(final_url)
                if final_response.status == 200:
                    # print("Final Response Text:\n", final_response.text)
                    html_content = await final_response.text()  # Await the response text
                    # print(html_content)
                    soup = BeautifulSoup(html_content, "html.parser")
                    # Find all rows in the table
                    rows = soup.find("table", {"id": "tableTwo"}).find("tbody").find_all("tr")

                    # Extract toxin/non-toxin prediction
                    result = []
                    for row in rows:
                        columns = row.find_all("td")
                        if len(columns) >= 4:  # Ensuring there are enough columns
                            # peptide_sequence = columns[1].text.strip()
                            prediction = columns[3].text.strip()  # Extracting "Toxin" or "Non-Toxin"
                            result.append( prediction)
                    print(f"Batch {batch_index + 1} of Toxicity processed successfully.")
                    return (result,batch_index,'Toxicity Test')

                else:
                    print(f"Batch {batch_index + 1}: Toxicity Server returned status {response.status}.")
                    return (["Network Error"] * batch_length, batch_index,'Toxicity Test')

            else:
                print(f"Batch {batch_index + 1}: Toxicity ERROR:NO REDIRECTION PAGE FOUND")
                return (["Rediriction Error"] * batch_length, batch_index,'Toxicity Test')

        else:
            print(f"Batch {batch_index + 1}: Toxicity Server returned status {response.status_code}.")
            return (["Network Error"] * batch_length, batch_index,'Toxicity Test')

# |-----------------------------------Antigen Prediction---------------------------|
async def scrape_antigen(session, batch_length, batch_index, batch_fasta_path, url):
    """Scrapes antigenicity tool"""
    print(f"Processing Antigen Batch {batch_index + 1}")
    # Implement Antigenicity scraping logic here...
    print(f"Batch {batch_index + 1} of Antigen processed successfully.")
    return (["Pending"] * batch_length, batch_index, "Antigen Test")

# |-----------------------------B Cell Prediction ----------------------------------------------|
async def scrape_bcell_epitope(session, df, output_file, threshold, window_size):
    print("""Fetching B Cell epitopes from ABCPred""")
    result_dict = {"Protein ID": [], "Epitope": [], "Score": []}
    
    async def get_bcell_epitope():
        url = "https://webs.iiitd.edu.in/cgibin/abcpred/test1_main.pl"

        async def fetch_bcell_epitope(session, sequence, id, index):
            """Fetch B Cell Epitope for a single protein ID asynchronously."""
            print("------------------------------------------------------")
            print(f"|   {index + 1}. Attempting: B Cell Epitope for: {id}  |")    
            
            payload = {
                "SEQNAME": "",
                "SEQ": f"{sequence}",
                "Threshold": threshold,
                "window": window_size,
                "filter": "on"
            }   

            try:
                async with session.post(url, data=payload) as response:
                    if response.status == 200:
                        html = await response.text()
                        soup = BeautifulSoup(html, 'lxml')

                        epitopes, scores = [], []
                        i = 0
                        for elements in soup.find_all('td', attrs={'width': '50%'}):
                            if i == 0:  # Skip the first irrelevant row
                                i += 1
                                continue
                            epitopes.append(elements.get_text())
                            i += 1

                        score_elements = soup.find_all('td', attrs={'width': '20%'})
                        for i in range(3, len(score_elements), 2):  # Start at 3, step by 2
                            scores.append(score_elements[i].get_text(strip=True))
                        
                        print(f"|   {index + 1}. Success   : B Cell Epitope for: {id}  |")
                        return id, epitopes, scores
                    else:
                        print(f"|   {index + 1}. Failed   : B Cell Epitope for: {id}  |")
                        return id, ["ERROR: HTTP Failed"], ["NA"]
            
            except Exception as e:
                print(f"|   {index + 1}. Error    : {e} for {id}  |")
                return id, ["ERROR: Exception"], ["NA"]

        results=[]
        for row in df.itertuples(index=True, name="Row"):
            results.append(await asyncio.create_task(fetch_bcell_epitope(session, row.Sequence, row._1, row.Index)))
        # Organize results into a dictionary
        for id, epitopes, scores in results:
            for epitope, score in zip(epitopes, scores):
                result_dict["Protein ID"].append(id)
                result_dict["Epitope"].append(epitope)
                result_dict["Score"].append(score)
        
        return result_dict  # Ensure return value is properly passed

    result_dict = await get_bcell_epitope()
    
    print("Result for ABCPred")
    print(result_dict)
    
    df2 = pd.DataFrame(data=result_dict)  # contains epitopes
    df2.to_csv(output_file, index=False)
    
    print("Done ABCPred")
    return "done Bcell"

# |-----------------------------CTL Cell Prediction ----------------------------------------------|
async def scrape_ctl_epitope(session, df, output_file, type, c_terminal, tap_efficiency, ctl_threshold):
    print("""Fetching CTL Cell Epitopes from NetCTL""")
    result_dict = {"Protein ID": [], "Epitope": [], "Score": []}

    async def get_ctl_epitope():
        url = "https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi"

        async def fetch_ctl_epitope(session, sequence, id, index):
            
            print("------------------------------------------------------")
            print(f"|   {index + 1}. Attempting: CTL Cell Epitope for: {id}  |")

            payload = {
                "configfile": "/var/www/services/services/NetCTL-1.2/webface.cf",
                "SEQPASTE": sequence,
                "supertype": type,
                "wcle": c_terminal,
                "wtap": tap_efficiency,
                "threshold": ctl_threshold,
                "sort": 0
            }
            try:
                async with session.post(url, data=payload,allow_redirects=False) as response:
                    epitopes, scores = [], []
                    if response.status != 302:
                        print("Error: Job submission failed.")
                        return id, ["ERROR: Submission Failed"], ["NA"]
                    # Extract the redirect URL (Job Status Page)
                    base_url = "https://services.healthtech.dtu.dk"
                    job_status_url = base_url + response.headers['Location']
                    print(f"> Job submitted. Checking status...")
                    while True:
                        final_response = await session.get(job_status_url)
                        # if final_response.status == 200:
                        html_content = await final_response.text()
                        # print("Final Response Text:\n", html_content)
                        soup = BeautifulSoup(html_content, 'lxml')
                        pre_tag = soup.find('pre')  # Look for the <pre> tag containing results
                
                        # Check for completion markers
                        if pre_tag and "NetCTL-1.2 predictions using MHC supertype A1." in pre_tag.text:
                            print(f"> Job finished. Extracting results...")
                            # Extract epitope data from the <pre> content
                            lines = pre_tag.text.splitlines()
                            for line in lines:
                                if "<-E" in line:  # Identify lines with epitopes
                                    parts = line.split()
                                    epitope = parts[4]  # Assuming 4th column is Epitope
                                    score = float(parts[-2])  # Assuming second last column is COMB score
                                    if(score>1.0):
                                        epitopes.append(epitope)
                                        scores.append(score)
                            print(f"{index + 1}. Successfull: {id}")
                            return id, epitopes, scores
                        
                        elif "Jobid not provided" in soup.text:
                            print(f"|   {index + 1}. Failed   : TCA1 Epitope for: {id}  |")
                            return id,["ERROR: Job Failed"], ["NA"]
                        else:
                            print(f"> Still processing...")
                            time.sleep(1)
            except Exception as e:
                print("Network Error",e)
                return id,["ERROR: Job Failed"], ["NA"]
        # async with aiohttp.ClientSession() as session:
        # tasks = [fetch_tca1_epitope(session, row.Sequence, row._1, row.Index) for row in df.itertuples(index=True, name="Row")]
        # results = await asyncio.gather(*tasks)  # Run all requests concurrently
        results=[]
        for row in df.itertuples(index=True, name="Row"):
            results.append(await asyncio.create_task(fetch_ctl_epitope(session, row.Sequence, row._1, row.Index)))

    
        # Organize results into a dictionary
        for id, epitopes, scores in results:
            for epitope, score in zip(epitopes, scores):
                result_dict["Protein ID"].append(id)
                result_dict["Epitope"].append(epitope)
                result_dict["Score"].append(score)
        
        return result_dict  # Ensure return value is properly passed

    result_dict = await get_ctl_epitope()

    print("Result for NetCTL")
    print(result_dict)
    
    df2 = pd.DataFrame(data=result_dict)  # contains epitopes
    df2.to_csv(output_file, index=False)
    
    print("Done NetCTL")
    return "done NetCTL"

# |-----------------------------Helper T Cell Prediction ----------------------------------------------|
async def scrape_ht_epitope(session, df, output_file, peptide_length, selected_alleles, strongBinder=0.5, weakBinder=2, filteringThreshold='-99'):
    print("""Fetching MHC-I epitope results from NetMHCI""")
    result_dict = {"Protein ID": [], "Epitope": [], "Score": [], 'Allele': []}

    async def get_ht_epitope():
        url = "https://services.healthtech.dtu.dk/cgi-bin/webface2.cgi"

        async def fetch_ht_epitope(session, sequence, id, index):
            """Fetch HT Cell Epitope for a single protein ID asynchronously."""
            print("------------------------------------------------------")
            print(f"|   {index + 1}. Attempting: HT Cell Epitope for: {id}  |")

            payload = {
                "configfile": "/var/www/services/services/NetMHCpan-4.0/webface.cf",
                "inp":0,
                "SEQPASTE": sequence,
                "len":peptide_length,
                "allele": selected_alleles,
                "thrs":strongBinder,
                "thrw":weakBinder,
                'threshold':filteringThreshold,
                "sort": 'on'
                # "master": 2,
                # "slave0":"HLA-B58:01",
                # 'PEPSUB': '(binary)',
                # 'SEQSUB': '(binary)',
            }
            try:
                async with session.post(url, data=payload,allow_redirects=False) as response:
                    epitopes, scores, alleles = [], [], []
                    if response.status != 302:
                        print("Error: Job submission failed.")
                        return id, ["ERROR: Submission Failed"], ["NA"], ["NA"]
                    # Extract the redirect URL (Job Status Page)
                    base_url = "https://services.healthtech.dtu.dk"
                    job_status_url = base_url + response.headers['Location']
                    print(f"> Job submitted. Checking status...")
                    while True:
                        final_response = await session.get(job_status_url)
                        html_content = await final_response.text()
                        # print("Final Response Text:\n", html_content)
                        soup = BeautifulSoup(html_content, 'lxml')
                        pre_tag = soup.find('pre')  # Look for the <pre> tag containing results
                        if pre_tag:
                            print(f"> Job finished. Extracting results...")
                            # Extract epitope data from the <pre> content
                            lines = pre_tag.text.splitlines()
                            for line in lines:
                                if "<= SB" in line:  # Identify lines with epitopes
                                    parts = line.split()
                                    epitope = parts[2]  # Assuming 4th column is Epitope
                                    allele=parts[1] 
                                    score = float(parts[-4])  # Assuming second last column is COMB score
                                    epitopes.append(epitope)
                                    scores.append(score)
                                    alleles.append(allele)
                            print(f"{index + 1}. Successfull: {id}")
                            return id, epitopes, scores, alleles
                
                        elif "Jobid not provided" in soup.text:
                            print(f"Job {id} encountered an error.")
                            return id,["ERROR: Job Failed"], ["NA"], ["NA"]
                        else:
                            print(f"> Still processing...")
                            time.sleep(1)
            except Exception as e:
                print("Network Error",e)
            return id,["ERROR: Job Failed"], ["NA"], ["NA"]
        results=[]
        for row in df.itertuples(index=True, name="Row"):
            results.append(await asyncio.create_task(fetch_ht_epitope(session, row.Sequence, row._1, row.Index)))
    
        # Organize results into a dictionary
        for id, epitopes, scores, allele in results:
            for epitope, score in zip(epitopes, scores):
                result_dict["Protein ID"].append(id)
                result_dict["Epitope"].append(epitope)
                result_dict["Score"].append(score)
                result_dict["Allele"].append(allele)
        
        return result_dict  # Ensure return value is properly passed

    result_dict = await get_ht_epitope()

    print("Result for MHC-I")
    print(result_dict)
    
    df2 = pd.DataFrame(data=result_dict)  # contains epitopes
    df2.to_csv(output_file, index=False)
    
    print("Done MHC-I")
    return "done MHC-I"

# |-----------------------------IFN Gamma Prediction ----------------------------------------------|
async def scrape_ifn_epitope(session, df, output_file, peptide_length, selected_alleles, strongBinder=1, weakBinder=5):
    print("""Fetch MHC-II Epitope Results from NetMHC-II.""")
    result_dict = {"Protein ID": [], "Epitope": [], "Score": [], "Allele": []}

    async def get_ifn_epitope():
        url = "https://services.healthtech.dtu.dk/cgi-bin/webface2.fcgi"

        async def fetch_ifn_epitope(session, sequence, id, index):
            """Fetch IFN Cell Epitope for a single protein ID asynchronously."""
            print("------------------------------------------------------")
            print(f"|   {index + 1}. Attempting: IFN Cell Epitope for: {id}  |")

            payload = {
                "configfile": "/var/www/services/services/NetMHCIIpan-4.0/webface.cf",
                "inp":'0',
                "SEQPASTE": sequence,
                "SEQSUB": "(binary)",
                "PEPSUB": "(binary)",
                "termAcon": "on",
                "length":peptide_length,
                "allele": selected_alleles,
                "thrs":strongBinder,
                "thrw":weakBinder,
                'thrf': 10,
                "sort": 'on'
                # "master": 2,
                # "slave0":"HLA-B58:01",
                # 'PEPSUB': '(binary)',
                # 'SEQSUB': '(binary)',
            }
            try:
                async with session.post(url, data=payload,allow_redirects=False) as response:
                    epitopes, scores, alleles = [], [], []
                    if response.status != 302:
                        print("Error: Job submission failed.")
                        return id, ["ERROR: Submission Failed"], ["NA"], ["NA"]
                    # Extract the redirect URL (Job Status Page)
                    base_url = "https://services.healthtech.dtu.dk"
                    job_status_url = base_url + response.headers['Location']
                    print(f"> Job submitted. Checking status...")
                    while True:
                        final_response = await session.get(job_status_url)
                        html_content = await final_response.text()
                        soup = BeautifulSoup(html_content, 'lxml')
                        pre_tag = soup.find('pre')  # Look for the <pre> tag containing results
                        if pre_tag:
                            print(f"> Job finished. Extracting results...")
                            lines = pre_tag.text.splitlines()
                            for line in lines:
                                if "<= SB" in line:  # Identify lines with epitopes
                                    parts = line.split()
                                    epitope = parts[2]  # Assuming 4th column is Epitope
                                    allele=parts[1] 
                                    score = float(parts[-4])  # Assuming second last column is COMB score
                                    epitopes.append(epitope)
                                    scores.append(score)
                                    alleles.append(allele)
                            print(f"{index + 1}. Successfull: {id}")
                            return id, epitopes, scores, alleles
                
                        elif "Jobid not provided" in soup.text:
                            print(f"Job {id} encountered an error.")
                            return id,["ERROR: Job Failed"], ["NA"], ["NA"]
                        else:
                            print(f"> Still processing...")
                            time.sleep(1)
            except Exception as e:
                print("Network Error",e)
            return id,["ERROR: Job Failed"], ["NA"], ["NA"]
        results=[]
        for row in df.itertuples(index=True, name="Row"):
            results.append(await asyncio.create_task(fetch_ifn_epitope(session, row.Sequence, row._1, row.Index)))
    
        # Organize results into a dictionary
        for id, epitopes, scores, allele in results:
            for epitope, score in zip(epitopes, scores):
                result_dict["Protein ID"].append(id)
                result_dict["Epitope"].append(epitope)
                result_dict["Score"].append(score)
                result_dict["Allele"].append(allele)
        
        return result_dict  # Ensure return value is properly passed

    result_dict = await get_ifn_epitope()

    print("Result for MHC-II")
    print(result_dict)
    
    df2 = pd.DataFrame(data=result_dict)  # contains epitopes
    df2.to_csv(output_file, index=False)
    
    print("Done MHC-II")
    return "done MHC-II"



@celery.task
def add(x, y):
    """Simulate a long-running task (5 seconds delay)."""
    print(x,y)
    time.sleep(5)
    return x + y
