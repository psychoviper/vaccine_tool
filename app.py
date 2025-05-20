import asyncio
from tasks import add, batch_processing, batch2_processing, process_epitope_batch, celery
from allele_data.data import hla_a1, hla_a2, hla_a11, hla_a23, hla_a24, hla_a25, hla_a26, hla_a29, hla_a30, hla_b, DR, DP_alpha, DP_beta, DQ_alpha, DQ_beta, Mouse
from utils import filtering, merge_epitopes, fasta_to_csv
import asyncio
import os
import uvicorn
import uuid
import csv
import sys
import zipfile
from io import BytesIO
from quart import Quart, session, send_file, render_template, request, send_from_directory, abort, render_template_string, jsonify

app = Quart(__name__)
app.secret_key = '9cbf1e347601520c9c90ea8fc40b5739ece37ac2c4a90d05febf780b5513e63c'

UPLOAD_FOLDER = 'uploads'
OUTPUT_FOLDER = 'outputs'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['OUTPUT_FOLDER'] = OUTPUT_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

RESULT_PAGE_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="60">
    <title>Task Status</title>
</head>
<body>
    <h2>Task Status: {{ status }}</h2>
    {% if result is not none %}
        <p>Result: {{ result }}</p>
    {% else %}
        <p>Waiting for result... Refreshing in 2 seconds.</p>
    {% endif %}
</body>
</html>
"""
COUNTER_FILE = "counter.txt"

# Initialize counter file if not exists
if not os.path.exists(COUNTER_FILE):
    with open(COUNTER_FILE, "w") as f:
        f.write("0")

def get_and_increment_counter():
    with open(COUNTER_FILE, "r+") as f:
        count = int(f.read())
        count += 1
        f.seek(0)
        f.write(str(count))
        f.truncate()
    return count

async def process_file():
    bcell_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['abcpredFile'])
    ctl_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netctlFile'])
    th_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIFile'])
    th_ifn=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIIFile'])
    try:
        filtered_abcpred_filename=session['user_id']+'_filtered_abcpred.csv'
        filtered_netctl_filename=session['user_id']+'_filtered_netctl.csv'
        filtered_netmhcI_filename=session['user_id']+'_filtered_netmhcI.csv'
        filtered_netmhcII_filename=session['user_id']+'_filtered_netmhcII.csv'
        filtered_abcpred_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_abcpred_filename)
        filtered_netctl_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netctl_filename)
        filtered_netmhcI_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netmhcI_filename)
        filtered_netmhcII_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netmhcII_filename)
        session['filtered_abcpredFile']=filtered_abcpred_filename
        session['filtered_netctlFile']=filtered_netctl_filename
        session['filtered_netmhcIFile']=filtered_netmhcI_filename
        session['filtered_netmhcIIFile']=filtered_netmhcII_filename
        results={}
        results['bcell']= filtering(bcell_csv, filtered_abcpred_csv,False)
        results['netctl']= filtering(ctl_csv, filtered_netctl_csv,False)
        results['netmhci']= filtering(th_csv, filtered_netmhcI_csv,False)
        results['netmhcii']= filtering(th_ifn, filtered_netmhcII_csv,False)
        file_paths = [ filtered_abcpred_csv, filtered_netctl_csv, filtered_netmhcI_csv, filtered_netmhcII_csv ]
        merged_epitopes = await asyncio.create_task(merge_epitopes(file_paths))
        outputFileName=session['user_id']+'_final_merged_file.csv'
        output_csv=os.path.join(app.config['OUTPUT_FOLDER'],outputFileName)
        merged_epitopes.to_csv(output_csv, index=False)
        return results
    except Exception as e:
        print(f"Error during filtration process: {e}")
        session['error_message'] = "Error during filtration process. Please try again."
        return None


@app.route("/result/<task_id>/<step>/<dir_path>")
async def get_result(task_id, step, dir_path):
    """Fetch task result and display with auto-refresh."""
    task = celery.AsyncResult(task_id)
    print(task.state)
    if task.state == "PENDING":
        return await render_template(
            step,
            processing=True,
            id=task_id,
            file_processed=True,
            processed_filename=session.get('processed_filename',''),
            error_message=session.get('error_message'),
        )
        # return await render_template_string(RESULT_PAGE_TEMPLATE, status="PENDING", result=None), 202
    else:
        if os.path.exists(dir_path) and os.path.isdir(dir_path):  
            os.rmdir(dir_path)
        if task.state == "SUCCESS":
            session['file_processed'] = True
            session['processed_filename'] = session['converted_filename']
            return await render_template(
                step,
                processing=False,
                file_processed=session.get('file_processed'),
                processed_filename=session.get('processed_filename'),
                error_message=session.get('error_message')
            )
            # return await render_template_string(RESULT_PAGE_TEMPLATE, status="SUCCESS", result=task.result), 200
        elif task.state == "FAILURE":
            return await render_template_string(RESULT_PAGE_TEMPLATE, status="FAILURE", result="Error"), 500
        else:
            return await render_template_string(RESULT_PAGE_TEMPLATE, status=task.state, result=None), 202


@app.route('/task_status/<task_id>/<step>', methods=['GET'])
async def task_status(task_id, step):
    task_result = celery.AsyncResult(task_id)
    if task_result.state == 'PENDING':
        return jsonify({'status': 'pending'}), 202
    elif task_result.state == 'SUCCESS':
        if(step=='step2'):
            print("Task",task_id,"Step",step)
            fileName=session['user_id']+'_filtered_sequences.csv'
            output_csv=os.path.join(app.config['OUTPUT_FOLDER'], fileName)
            result = filtering(os.path.join(app.config['OUTPUT_FOLDER'], session['converted_filename']), output_csv)
            session['filtered_filename'] = fileName
            print(result)
            return jsonify({'status': 'success', 'result': result}), 200
        if(step=='step3'):
            print(task_result)
            result=task_result.result
            return jsonify({'status': 'success', 'result': result}), 200
        if(step=='step4'):
            result = await asyncio.create_task(process_file())
            return jsonify({'status': 'success', 'result': result}), 200
        return jsonify({'status': 'success', 'result': task_result.result}), 200
        # return jsonify({'status': 'success', 'result': task_result.result}), 200
    elif task_result.state == 'FAILURE':
        return jsonify({'status': 'failure', 'error': str(task_result.result)}), 500
        # return jsonify({'status': 'failure', 'error': str(task_result.result)}), 500
    else:
        return jsonify({'status': task_result.state}), 202

# @app.route('/download/<filename>')
# async def download(filename):
#     # Ensure the file exists in the output folder
#     filename = session['user_id'] + filename
#     file_path = os.path.join(app.config['OUTPUT_FOLDER'], filename)
    
#     if os.path.exists(file_path):
#         return await send_from_directory(app.config['OUTPUT_FOLDER'], filename, as_attachment=True, download_name=filename[1:])
#     else:
#         # If the file does not exist, show a 404 error
#         await abort(404, description="File not found.")


@app.route('/download/<step>')
async def download_step(step):
    user_id = session.get('user_id')
    output_folder = app.config['OUTPUT_FOLDER']
    
    if not user_id:
        return jsonify({'error': 'User not logged in'}), 400

    if step == "step2":
        filename = f"{user_id}_filtered_sequences.csv"
        filepath = os.path.join(output_folder, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        return await send_file(filepath, as_attachment=True, attachment_filename='filtered_sequences.csv')

    elif step == "step3":
        files = [
            f"{user_id}_abcpred.csv",
            f"{user_id}_netctl.csv",
            f"{user_id}_netmhcI.csv",
            f"{user_id}_netmhcII.csv",
        ]
        return await create_and_send_zip(files, output_folder, zip_name="step3_results.zip")

    elif step == "step4":
        files = [
            f"{user_id}_filtered_abcpred.csv",
            f"{user_id}_filtered_netctl.csv",
            f"{user_id}_filtered_netmhcI.csv",
            f"{user_id}_filtered_netmhcII.csv",
        ]
        return await create_and_send_zip(files, output_folder, zip_name="step4_results.zip")
    
    elif step == "step5":
        filename = f"{user_id}_final_merged_file.csv"
        filepath = os.path.join(output_folder, filename)
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found'}), 404
        return await send_file(filepath, as_attachment=True, attachment_filename='final_merged_file.csv')

    else:
        return jsonify({'error': 'Invalid step'}), 400

async def create_and_send_zip(file_list, folder_path, zip_name):
    memory_file = BytesIO()
    with zipfile.ZipFile(memory_file, 'w') as zf:
        for fname in file_list:
            fpath = os.path.join(folder_path, fname)
            if os.path.exists(fpath):
                # Add to zip without the user_id in filename
                short_name = fname.split('_', 1)[-1]  # removes user_id_
                zf.write(fpath, arcname=short_name)
    memory_file.seek(0)
    return await send_file(memory_file, as_attachment=True, attachment_filename=zip_name, mimetype='application/zip')



@app.route('/')
async def index():
    visitor_count = get_and_increment_counter()
    if 'user_id' not in session:
        session['user_id'] = str(uuid.uuid4())
    return await render_template('homepage.html', count=visitor_count)  

@app.route('/analysis', methods=['GET', 'POST'])
async def analysis():
    return await render_template('main.html')

@app.route('/step1', methods=['GET', 'POST'])
async def upload():
    session['step'] = 1 
    if request.method == 'POST':
        files = await request.files
        print(files)
        form_data = await request.form
        if 'default' in form_data:
            filename = 'default_file.fa'
            file_path = os.path.join(app.config['UPLOAD_FOLDER'],filename)
            session['file_path'] = file_path
        else:
            file = files.get("file")
            if not file or file.filename == "":
                abort(400, description="No file was uploaded. Please go back and upload a fasta file.")
            filename = file.filename
            if not filename.endswith('.fa'):
                abort(422, description="Only .fa files are allowed")
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], session['user_id']+filename)
            await file.save(file_path)
            session['file_path'] = file_path
        try:
            converted_filename=f"{session['user_id']}.csv"
            if not os.path.exists(file_path):
                print(f"Error: Input file '{file_path}' does not exist!")
                sys.exit(1)
            total_sequences = fasta_to_csv(file_path, os.path.join(app.config['OUTPUT_FOLDER'], converted_filename))
            print(total_sequences)
            # session['file_converted'] = True
            session['converted_filename'] = converted_filename
            print(converted_filename)
            return jsonify({"message": "Success"})
            # return await render_template('step1.html', file_converted=True, converted_filename=session['converted_filename'])
        except Exception as e:
            session['error_message'] = e
            return await render_template('step1.html', error_message=session['error_message'])
    return await render_template('step1.html', file_uploaded=False)
   
@app.route('/step2', methods=['GET', 'POST'])
async def step2():
    """Main batch processing function"""
    session['step'] = 2
    # if 'file_converted' in session:
    #     dropdown_values = [round(i, 1) for i in [x * 0.1 for x in range(-5, 21)]]

    #     # Read the converted CSV to get the number of sequences
    #     with open(csv_path, 'r') as csvfile:
    #         reader = csv.reader(csvfile)
    #         available_sequences = sum(1 for _ in reader) - 1  # Count rows
    print("step2")
    form_data = request.get_json()
    if request.method == 'POST':
        csv_path = os.path.join(app.config['OUTPUT_FOLDER'], session['converted_filename'])
        print(request)
        # form_data = await request.form  # Quart automatically makes it async
        data = await request.get_json()
        # print(data)
        # num_sequences = int(form_data["num_sequences"])
        # if(num_sequences > available_sequences):
        #     abort(416, description="Number of sequences exceeds available sequences. Please go back and select a valid number.")
        # selected_value = form_data.get('dropdown', '0.3')
        # prediction_type = form_data.get('prediction_type', 'bacteria')
        # session['prediction_type'] = prediction_type
        # session['num_sequences'] = num_sequences  # Save user selection
        try:
            dir_path = session['user_id']
            os.makedirs(dir_path, exist_ok=True)
            task = batch_processing.apply_async(args=[csv_path, session['user_id'], data])
            print("returned task id")
            return jsonify({"task_id": task.id})

        except Exception as e:
            session['error_message'] = f"Error during Step 2: {str(e)}"
            return jsonify({"message":"Error"})
        # return redirect(f"/result/{task.id}/step2.html/{dir_path}")

    # return await render_template('step2.html', available_sequences=available_sequences, values=dropdown_values, processing=False)


@app.route('/step3', methods=['GET', 'POST'])
async def step3():
    session['step'] = 3 
    # if 'file_processed' in session:
    #     threshold_values = [round(i,1) for i in [x * 0.1 for x in range(0, 11)]]
    #     window_values = [16,18]
    #     peptide_length = [8,9,10,11,12,13,14]
    #     supertype = ['A1','A2','A3','A24','A26','B7','B8','B27','B39','B44','B58','B62']
    if request.method == 'POST':
        form_data = await request.get_json()
        print(form_data)    
        # form_data = await request.form  # Quart automatically makes it async
        # threshold_value = float(form_data.get('threshold', '0.51'))
        # window_size = int(form_data.get('window', '16'))
        # type=form_data.get('supertype','A1')
        # c_terminal = float(form_data.get('c_terminal', '0.15'))
        # tap_efficiency = float(form_data.get('tap_efficiency', '0.05'))
        # ctl_threshold = float(form_data.get('ctl_threshold', '0.75'))
        # peptide_length = form_data.getlist('peptide_length', '10')
        # peptide_length = ','.join(peptide_length)
        # mhcii_peptide_length = form_data.getlist('mhcii_peptide_length', '10')
        # mhcii_peptide_length = ','.join(mhcii_peptide_length)
        # print(mhcii_peptide_length)
        # alleles = form_data.getlist('alleles', 'HLA-B58:01')
        # mhcii_alleles = form_data.getlist('mhcii_alleles', 'DPB1_0101')
        # alleles = ','.join(alleles)
        # mhcii_alleles = ','.join(mhcii_alleles)
        # strongBinder = float(form_data.get('strongBinder', '0.5'))
        # mhcii_strongBinder = float(form_data.get('mhcii_strongBinder', '1'))
        # weakBinder = float(form_data.get('weakBinder', '2'))
        # mhcii_weakBinder = float(form_data.get('mhcii_weakBinder', '5'))
        # filteringThreshold = float(form_data.get('filteringThreshold', '-99'))
        # radio = form_data.get('default')
        # print(radio)

        try:
            inputFileName=os.path.join(app.config['OUTPUT_FOLDER'], session['filtered_filename'])
            abcpred_FileName=session['user_id']+'_abcpred.csv'
            netctl_FileName=session['user_id']+'_netctl.csv'
            netmhcI_FileName=session['user_id']+'_netmhcI.csv'
            netmhcII_FileName=session['user_id']+'_netmhcII.csv'
            session['processing'] = True
            dir_path = session['user_id']
            os.makedirs(dir_path, exist_ok=True)
            # values=[threshold_value, window_size, type, c_terminal, tap_efficiency, ctl_threshold, 
            #         peptide_length, alleles, strongBinder, weakBinder, filteringThreshold,
            #         mhcii_peptide_length, mhcii_alleles, mhcii_strongBinder, mhcii_weakBinder
                    # ]
            task = batch2_processing.apply_async(args=[inputFileName,app.config['OUTPUT_FOLDER'], session['user_id'], form_data])
            if os.path.exists(dir_path) and os.path.isdir(dir_path):  
                os.rmdir(dir_path)
            session['abcpredFile'] = abcpred_FileName  # Simulate result file names
            session['netctlFile'] = netctl_FileName  # Simulate result file names
            session['netmhcIFile'] = netmhcI_FileName
            session['netmhcIIFile'] = netmhcII_FileName
            session['file_processed'] = True
            return jsonify({"task_id": task.id})
            # return redirect(f"/result/{task.id}/step4.html/{dir_path}")
        except Exception as e:
            session['file_processed'] = False
            print(f"Error running B: {e}")
            return jsonify({"message": "Error"})
        finally:
            session['file_processed'] = True
            session['processing'] = False
    else:
        session['file_processed'] = False
    return jsonify({"message": "Success"})

        # # Pass session values to the template
        # return await render_template(
        #     'step4.html',
        #     file_processed=session.get('file_processed', False),
        #     processing=session.get('processing', False),
        #     bCell_filename=session.get('bCell_filename', ''),
        #     filtered_filename=session.get('filtered_filename', ''),
        #     threshold=threshold_values,
        #     window=window_values,supertype=supertype,
        #     peptide_length=peptide_length,hla_a1=hla_a1,hla_a2=hla_a2,hla_a11=hla_a11,
        #     hla_a23=hla_a23,hla_a24=hla_a24,hla_a25=hla_a25,hla_a26=hla_a26,hla_a29=hla_a29,
        #     hla_a30=hla_a30,hla_b=hla_b,DR=DR,
        #     DP_alpha=DP_alpha,DP_beta=DP_beta,DQ_alpha=DQ_alpha,DQ_beta=DQ_beta,Mouse=Mouse
        # )

@app.route('/step4', methods=['GET', 'POST'])
async def step4():
    session['step'] = 4  # Update to Step 4
    if request.method == 'POST':
        form_data = await request.get_json()  # Quart automatically makes it async
        print("step4",form_data)
        # Start background processing using Celery
        bcell_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['abcpredFile'])
        ctl_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netctlFile'])
        th_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIFile'])
        th_ifn=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIIFile'])
        # dir_path = session['user_id']
        try:
            task = process_epitope_batch.apply_async(args=[session['user_id'], bcell_csv, ctl_csv, th_csv, th_ifn, form_data])
            print(f"Task ID: {task.id}")
            return jsonify({"task_id": task.id})

        except Exception as e:
            print(f"Error during Step 4: {e}")
            session['error_message'] = f"Error during Step 4: {str(e)}"
            return jsonify({"message": "Error"})
        
        # return redirect(f"/result/{task.id}/step5.html/{dir_path}")

    # return await render_template('step5.html', values=dropdown_values)

@app.route('/step6', methods=['GET', 'POST'])
async def step6():
    session['step'] = 6  # Update to Step 4
    if 'file_processed' in session:
        if request.method == 'POST':
            # Start the filtration process
            session['processing'] = True  # Set the processing state
            bcell_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['abcpredFile'])
            ctl_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netctlFile'])
            th_csv=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIFile'])
            th_ifn=os.path.join(app.config['OUTPUT_FOLDER'], session['netmhcIIFile'])
            try:
                filtered_abcpred_filename=session['user_id']+'_filtered_abcpred.csv'
                filtered_netctl_filename=session['user_id']+'_filtered_netctl.csv'
                filtered_netmhcI_filename=session['user_id']+'_filtered_netmhcI.csv'
                filtered_netmhcII_filename=session['user_id']+'_filtered_netmhcII.csv'
                filtered_bcell_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_abcpred_filename)
                filtered_ctl_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netctl_filename)
                filtered_th_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netmhcI_filename)
                filtered_ifn_csv=os.path.join(app.config['OUTPUT_FOLDER'], filtered_netmhcII_filename)
                session['filtered_abcpredFile']=filtered_abcpred_filename
                session['filtered_netctlFile']=filtered_netctl_filename
                session['filtered_netmhcIFile']=filtered_netmhcI_filename
                session['filtered_netmhcIIFile']=filtered_netmhcII_filename
                print(session)
                await asyncio.create_task(filtering(bcell_csv, filtered_bcell_csv,False))
                await asyncio.create_task(filtering(ctl_csv, filtered_ctl_csv,False))
                await asyncio.create_task(filtering(th_csv, filtered_th_csv,False))
                await asyncio.create_task(filtering(th_ifn, filtered_ifn_csv,False))
                # session['file_filtered'] = True
                session['file_processed'] = True
                session['processing'] = False  # Clear processing state after completion
            except Exception:
                print("Error during filtration process. Please try again.")
                session['error_message'] = "Error during filtration process. Please try again."
                session['processing'] = False  # Clear processing state in case of an error
        else:
            session['file_processed'] = False
        return await render_template('step6.html', 
                               processing=session.get('processing'), 
                               file_processed=session.get('file_processed'), 
                               filtered_bCell_filename=session.get('filtered_bCell_filename', ''), 
                               filtered_ctl_csv=session.get('filtered_ctl_filename', ''), 
                               filtered_ht_filename=session.get('filtered_ht_filename', ''), 
                               filtered_ifn_filename=session.get('filtered_ifn_filename', ''), 
                               error_message=session.get('error_message'))

@app.route('/step7', methods=['GET', 'POST'])
async def step7():
    session['step'] = 7  # Update to Step 9
    if 'file_processed' in session:
        # Handle POST request when the user clicks "Start Filtration"
        if request.method == 'POST':
            # Start the filtration process
            session['processing'] = True  # Set the processing state
            try:
                file_paths = [
                    os.path.join(app.config['OUTPUT_FOLDER'], session['filtered_bCell_filename']),
                    os.path.join(app.config['OUTPUT_FOLDER'], session['filtered_ctl_filename']),
                    os.path.join(app.config['OUTPUT_FOLDER'], session['filtered_ht_filename']),
                    os.path.join(app.config['OUTPUT_FOLDER'], session['filtered_ifn_filename']),
                ]
                merged_epitopes = await asyncio.create_task(merge_epitopes(file_paths))
                # Save the merged DataFrame to a CSV file
                outputFileName=session['user_id']+'_final_merged_file.csv'
                output_csv=os.path.join(app.config['OUTPUT_FOLDER'],outputFileName)
                merged_epitopes.to_csv(output_csv, index=False)
                session['file_filtered'] = True
                session['file_processed'] = True
                session['final_merged_filename'] = outputFileName  # Replace with actual output filename
                session['processing'] = False  # Clear processing state after completion
            except Exception:
                print("Error during filtration process. Please try again.")
                session['error_message'] = "Error during filtration process. Please try again."
                session['processing'] = False  # Clear processing state in case of an error
        else:
            session['file_processed'] = False
        return await render_template('step7.html', 
                               processing=session.get('processing'), 
                               file_processed=session.get('file_processed'), 
                               filtered_filename=session.get('final_merged_filename'), 
                               error_message=session.get('error_message'))

@app.route('/last', methods=['GET', 'POST'])
async def last():
    steps_files = {
        # "File1: Fasta to CSV": session['converted_filename'],
        # "Step2: Allergenicity Test": session['processed_filename'],
        # "Step3: Signal P Detection": session['processed_filename'],
        "File1: Filtered Sequence File": session['filtered_filename'],
        "File2: B Cell Epitopes File": session['filtered_bCell_filename'],
        "File3: TC(A1) Epitope Detection": session['filtered_ctl_filename'],
        "File4: TC(B58) Epitope Detection": session['filtered_ht_filename'],
        "File5: TH Epitope Detection": session['filtered_ifn_filename'],
        "File6: Final Merged File": session['final_merged_filename'],
    }
    final_filename = "final_merged_output.csv"

    return await render_template(
        'last.html',
        steps_files=steps_files,
        final_filename=final_filename
    )
    
if __name__ == "__main__":
    # app.run(debug=True, host="0.0.0.0", port=8000)
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)




# @app.route('/step3', methods=['GET', 'POST'])
# async def step3():
#     session['step'] = 3  # Update to Step 4
#     if 'file_processed' in session:
#         if request.method == 'POST':
#             # Start the filtration process
#             session['processing'] = True  # Set the processing state
#             try:
#                 fileName=session['user_id']+'_filtered.csv'
#                 output_csv=os.path.join(app.config['OUTPUT_FOLDER'], fileName)
#                 await asyncio.create_task(filtering(os.path.join(app.config['OUTPUT_FOLDER'], session['processed_filename']), output_csv))
#                 session['file_filtered'] = True
#                 session['file_processed'] = True
#                 session['filtered_filename'] = fileName  
#                 session['processing'] = False  # Clear processing state after completion
#             except Exception:
#                 session['error_message'] = "Error during filtration process. Please try again."
#                 session['processing'] = False  # Clear processing state in case of an error
#         else:
#             session['file_processed'] = False
#         return await render_template('step3.html', 
#                                processing=session.get('processing'), 
#                                file_processed=session.get('file_processed'), 
#                                filtered_filename=session.get('filtered_filename'), 
#                                error_message=session.get('error_message'))