import pandas as pd
import asyncio
from bs4 import BeautifulSoup
import time

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
                        # if pre_tag and "NetCTL-1.2 predictions using MHC supertype" in pre_tag.text:
                        if pre_tag:
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
                print("Network Error int netctl",e)
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
    
    count = len(result_dict['Epitope']) - result_dict['Epitope'].count("ERROR: Job Failed")
    print(count)
    return count
