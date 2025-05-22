import pandas as pd
import os

# |-------------------------------Filtering the csv file--------------------------------------|
def filtering(input_csv, output_csv, cond=True):
    df = pd.read_csv(input_csv)
    # Apply the filter conditions
    data = {
        "allergen_count": 0,
        "toxicity_count": 0,
        "signalp_count": 0,
        "antigen_count": 0,
    }
    if df.empty:
        # df.columns = ['Protein ID', 'Allergen Test', 'Toxicity Test', 'Antigen Test', 'Signal P']
        print(f"Warning: {input_csv} contains only headers. Saving headers only to {output_csv}.")
        df.to_csv(output_csv, index=False)  # Save headers only
        return data
    if cond:
        filtered_df = df[
            (df['Allergen Test'] == 'Non-Allergen') & 
            (df['Antigen Test'] == 'Antigen') & #change this after proper implementation of antigen-test (vaxijen)
            (df['Signal P'] == 'Found')
        ]
        data['signalp_count'] = int((df['Signal P'] == 'Found').sum())
    else:
        filtered_df = df[
            (df['Allergen Test'] == 'Non-Allergen') & 
            (df['Toxicity Test']=='Non-Toxin') &
            (df['Antigen Test'] == 'Antigen')#change this after proper implementation of antigen-test (vaxijen)
        ]
        data['toxicity_count'] = int((df['Toxicity Test']=='Non-Toxin').sum())
    data['allergen_count'] = int((df['Allergen Test'] == 'Non-Allergen').sum())
    data['antigen_count'] = int((df['Antigen Test'] == 'Antigen').sum())
    data['total_count'] = len(filtered_df)
    filtered_df.to_csv(output_csv, index=False)
    print(f"Filtered data has been saved to {output_csv}")
    return data

async def merge_epitopes(file_paths):
    dfs = []
    for file_path in file_paths:
        try:
            df = pd.read_csv(file_path)
            if df.empty:
                print(f"Warning: {file_path} is empty.")
                continue
            # Determine cell type based on filename
            software_type = file_path.split('/')[-1].split('_')[-1][:-4]
            print(software_type)
            if software_type == 'abcpred':
                cell_type = 'BCell'
            elif software_type == 'netctl'or software_type == 'netmhcI':
                cell_type = 'CTLCell'
            elif software_type == 'netmhcII':
                cell_type = 'HTCell'
            # Add cell type column
            df['Software Type'] = software_type
            df['Cell Type'] = cell_type
            # Handle missing columns for non-TH types
            # if cell_type != 'TH(IFN)':
            #     for col in ['Result', 'Allele', 'IFN_Gamma']:
            #         if col not in df.columns:
            #             df[col] = 'NA'

            # Reorder columns for consistent output
            df = df[['Software Type', 'Cell Type', 'Protein ID', 'Epitope', 'Allergen Test', 'Toxicity Test', 'Antigen Test']]
            # df = df[['Cell Type', 'Protein ID', 'Epitope', 'Allergen Test', 'Toxicity Test', 'Antigen Test', 'Score', 'Allele', 'Result', 'IFN_Gamma']]

        except FileNotFoundError:
            print(f"Error: File not found - {file_path}")
            continue

        dfs.append(df)

    # Concatenate DataFrames (handles potential missing columns)
    merged_df = pd.concat(dfs, ignore_index=True, sort=False)

    return merged_df


# |----------------------  Fasta to csv converter -----------------------------|
def is_natural_sequence(sequence):
    """Strictly check if sequence contains only standard amino acids"""
    standard_aa = set('ACDEFGHIKLMNPQRSTVWY')
    return all(aa in standard_aa for aa in sequence)

def parse_fasta(file):
    data = {
        'Protein ID': [],
        'Allergen Test': [],
        'Antigen Test': [],
        'Signal P': [],
        'Sequence': []
    }
    total_sequences = 0
    natural_sequences = 0

    with open(file, 'r') as f:
        protein_id = ""
        sequence = []

        for line in f:
            line = line.strip()
            if line.startswith('>'):
                if protein_id:
                    total_sequences += 1
                    full_sequence = ''.join(sequence).upper()
                    if is_natural_sequence(full_sequence):
                        natural_sequences += 1
                        data['Protein ID'].append(protein_id)
                        data['Sequence'].append(full_sequence)
                        data['Allergen Test'].append("Pending")
                        data['Antigen Test'].append("Pending")
                        data['Signal P'].append("Pending")
                protein_id = line[1:].split()[0]
                sequence = []
            else:
                sequence.append(line)

        if protein_id:
            total_sequences += 1
            full_sequence = ''.join(sequence).upper()
            if is_natural_sequence(full_sequence):
                natural_sequences += 1
                data['Protein ID'].append(protein_id)
                data['Sequence'].append(full_sequence)
                data['Allergen Test'].append("Pending")
                data['Antigen Test'].append("Pending")
                data['Signal P'].append("Pending")

    return data, total_sequences, natural_sequences

def fasta_to_csv(fasta_file, csv_file):
    data, _, natural_seqs = parse_fasta(fasta_file)
    df = pd.DataFrame(data)
    df.to_csv(csv_file, index=False)
    return natural_seqs