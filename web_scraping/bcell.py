from bs4 import BeautifulSoup
import asyncio
import pandas as pd

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
    count = len(result_dict['Epitope']) - result_dict['Epitope'].count("ERROR: HTTP Failed") + result_dict['Epitope'].count("ERROR: Exception")
    print(count)
    return count