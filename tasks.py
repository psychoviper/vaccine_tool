import os
import math
import aiohttp
import aiofiles
import pandas as pd
from celery import Celery
import asyncio
import time
from web_scraping.allergen import scrape_allergen
from web_scraping.antigen import scrape_antigen
from web_scraping.toxicity import scrape_toxicity
from web_scraping.signalP import scrape_signalP
from web_scraping.bcell import scrape_bcell_epitope
from web_scraping.ctl import scrape_ctl_epitope
from web_scraping.mhc1 import scrape_ht_epitope
from web_scraping.mhc2 import scrape_ifn_epitope

#
#  Initialize Celery
celery = Celery(
    "tasks",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
)
celery.conf.update(task_serializer="json")


# -------------------------- BATCH PROCESSING FOR SEQUENCES FUNCTION ---------------------------#
@celery.task
# def batch_processing(input_file, selected_value, prediction_type, user_id, total_sequences=None):
def batch_processing(input_file, user_id, data):
    # print(f"data type: {type(data)}")
    print("Breaks input FASTA file into batches and processes them asynchronously")
    df = pd.read_csv(input_file)
    # print(data)
    selected_value = data.get('algpred', {}).get("threshold")
    prediction_type = data.get("vaxijen", {}).get("target")
    start = data.get("sequence_range", {}).get("start")
    end = data.get("sequence_range", {}).get("end")
    terminus = data.get('algpred', {}).get('method')
    # max_sequences = len(df)
    # if total_sequences is None or total_sequences > max_sequences:
    #     total_sequences = max_sequences
    total_sequences = end-start+1

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
        for batch_start in range(start, total_sequences, batch_size):
            batch_index = batch_start // batch_size
            batch = df.iloc[batch_start:min(batch_start + batch_size, total_sequences)]
            batch_fasta_path = f"{dir_path}/batch_{batch_index + 1}.fa"

            with open(batch_fasta_path, 'w') as f:
                for _, row in batch.iterrows():
                    f.write(f">Protein_{row['Protein ID']}\n{row['Sequence']}\n")

            tasks.append(scrape_all_tools(len(batch), batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, prediction_type, total_sequences, terminus, dir_path, input_file))

        await asyncio.gather(*tasks)

    asyncio.run(process_all_batches())

# ----------------------------------||--------------------------------------------------
async def scrape_all_tools(batch, batch_index, batch_fasta_path, url_allergen, url_signalP, url_antigen, selected_value, prediction_type, total_sequences,terminus,dir_path,input_file):
    print("Scrapes antigenicity, allergenicity, and SignalP tools concurrently")
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_allergen(session, batch, batch_index, batch_fasta_path, url_allergen, selected_value, terminus),
            scrape_signalP(session, batch, batch_index, batch_fasta_path, url_signalP),
            scrape_antigen(session, batch, batch_index, batch_fasta_path, url_antigen, prediction_type),
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
    # bCell_FileName=user_id+'_bCell.csv'
    # ctl_FileName=user_id+'_ctl.csv'
    # ht_FileName=user_id+'_ht.csv'
    # ifn_FileName=user_id+'_ifn.csv'
    # bCell_csv=os.path.join(path, bCell_FileName)
    # ctl_csv=os.path.join(path, ctl_FileName)
    # ht_csv=os.path.join(path, ht_FileName)
    # ifn_csv=os.path.join(path, ifn_FileName)
    abcpred_FileName=user_id+'_abcpred.csv'
    netctl_FileName=user_id+'_netctl.csv'
    netmhcI_FileName=user_id+'_netmhcI.csv'
    netmhcII_FileName=user_id+'_netmhcII.csv'
    abcpred_csv=os.path.join(path, abcpred_FileName)
    netctl_csv=os.path.join(path, netctl_FileName)
    netmhcI_csv=os.path.join(path, netmhcI_FileName)
    netmhcII_csv=os.path.join(path, netmhcII_FileName)
    df = pd.read_csv(input_file)
    async with aiohttp.ClientSession() as session:
        tasks = [
            scrape_bcell_epitope(session, df, abcpred_csv, values['abcpred']['threshold'], values['abcpred']['length']),
            scrape_ctl_epitope(session, df, netctl_csv, values['netctl']['supertype'], values['netctl']['cTerminal'], values['netctl']['tapEfficiency'], values['netctl']['threshold']),
            scrape_ht_epitope(session, df, netmhcI_csv, values['netmhci']['length'], values['netmhci']['alleles'], values['netmhci']['strongThreshold'], values['netmhci']['weakThreshold']),
            scrape_ifn_epitope(session, df, netmhcII_csv, values['netmhcii']['length'], values['netmhcii']['alleles'], values['netmhcii']['strongThreshold'], values['netmhcii']['weakThreshold']),
        ]
        results = await asyncio.gather(*tasks)
    return results


@celery.task
def process_epitope_batch(user_id,bcell_csv, ctl_csv, th_csv, th_ifn, values):
    print('Processing epitope batch', values)
    return asyncio.run(
        process_all_epitopes(user_id, bcell_csv, ctl_csv, th_csv, th_ifn, values)
    ) 
# ----------------------------------||--------------------------------------------------
# -------------------------- ASYNC Epitope Batch PROCESSING ---------------------------#
async def process_all_epitopes(user_id, bcell_csv, ctl_csv, th_csv, th_ifn, values):
    print("Scrapes antigenicity, toxicity, and Antigenicity concurrently")
    tasks = [
        epitope_processing(bcell_csv, user_id, 'bCell', values),
        epitope_processing(ctl_csv, user_id, 'CTH', values),
        epitope_processing(th_csv, user_id, 'HT', values),
        epitope_processing(th_ifn, user_id, 'IFN', values),
    ]
    results = await asyncio.gather(*tasks)
    return results
# ----------------------------------||--------------------------------------------------
# -------------------------- BATCH PROCESSING FOR SEQUENCES FUNCTION ---------------------------#
async def epitope_processing(input_file, user_id, type, values):
    df = pd.read_csv(input_file)
    # max_sequences=
    # if total_sequences is None or total_sequences > max_sequences:
    total_sequences = len(df)
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
            tasks.append(asyncio.create_task(scrape_toxicity(session,len(batch), batch_index, batch_fasta_path, url_toxicity, values['toxinpred']['method'], values['toxinpred']['cutoff'], values['toxinpred']['threshold'])))
            tasks.append(asyncio.create_task(scrape_allergen(session,len(batch), batch_index, batch_fasta_path, url_allergen, values['algpred']['threshold'], values['algpred']['method'])))
            tasks.append(asyncio.create_task(scrape_antigen(session,len(batch), batch_index, batch_fasta_path, url_antigen, values['vaxijen']['target'])))

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

@celery.task
def add(x, y):
    """Simulate a long-running task (5 seconds delay)."""
    print(x,y)
    time.sleep(5)
    return x + y
