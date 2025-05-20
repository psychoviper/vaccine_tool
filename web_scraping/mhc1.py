import asyncio
import time
import pandas as pd
from bs4 import BeautifulSoup

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
    
    count = len(result_dict['Epitope']) - result_dict['Epitope'].count("ERROR: Job Failed")
    print(count)
    return count