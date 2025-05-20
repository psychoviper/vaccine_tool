/**
 * Main JavaScript functionality for BioPipeline
 */

document.addEventListener('DOMContentLoaded', function() {
  initializeNavigation();
  setupWorkflowNavigation();
});

/**
 * Initialize the main navigation
 */
function initializeNavigation() {
  const navLinks = document.querySelectorAll('.main-nav a');
  const sections = document.querySelectorAll('.section');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links and sections
      navLinks.forEach(l => l.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Show corresponding section
      const targetId = this.getAttribute('id').replace('nav', '') + 'Section';
      console.log(targetId)
      document.getElementById(targetId).classList.add('active');
    });
  });
  
  // Documentation navigation
  const docLinks = document.querySelectorAll('.documentation-nav a');
  const docSections = document.querySelectorAll('.doc-section');
  
  docLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links and sections
      docLinks.forEach(l => l.classList.remove('active'));
      docSections.forEach(s => s.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Show corresponding section
      const targetId = this.getAttribute('href').substring(1);
      document.getElementById(targetId).classList.add('active');
    });
  });
  
  // Set up downloads filter
  const fileTypeFilter = document.getElementById('fileTypeFilter');
  const fileCards = document.querySelectorAll('.file-card');
  
  if (fileTypeFilter) {
    fileTypeFilter.addEventListener('change', function() {
      const filterValue = this.value;
      
      fileCards.forEach(card => {
        if (filterValue === 'all' || card.dataset.type === filterValue) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
}

/**
 * Set up workflow navigation and step transitions
 */
function setupWorkflowNavigation() {
  // Set up substep navigation
  const substepButtons = document.querySelectorAll('.substep-btn');
  
  substepButtons.forEach(button => {
    button.addEventListener('click', function() {
      const parentForm = this.closest('.multi-step-form');
      const targetSubstep = this.dataset.substep;
      
      // Update active button
      parentForm.querySelectorAll('.substep-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      this.classList.add('active');
      
      // Show target substep
      parentForm.querySelectorAll('.substep').forEach(step => {
        step.classList.remove('active');
      });
      parentForm.querySelector(`#substep${targetSubstep}`).classList.add('active');
    });
  });
  
  // Next/Previous buttons within substeps
  const nextButtons = document.querySelectorAll('.substep-next');
  const prevButtons = document.querySelectorAll('.substep-prev');
  
  nextButtons.forEach(button => {
    button.addEventListener('click', function() {
      const currentSubstep = this.closest('.substep');
      const parentForm = currentSubstep.closest('.multi-step-form');
      const currentNav = parentForm.querySelector('.substep-btn.active');
      const nextNav = currentNav.nextElementSibling;
      
      if (nextNav) {
        nextNav.click();
      }
    });
  });
  
  prevButtons.forEach(button => {
    button.addEventListener('click', function() {
      const currentSubstep = this.closest('.substep');
      const parentForm = currentSubstep.closest('.multi-step-form');
      const currentNav = parentForm.querySelector('.substep-btn.active');
      const prevNav = currentNav.previousElementSibling;
      
      if (prevNav) {
        prevNav.click();
      }
    });
  });
  
  // Step navigation
  setupStepNavigation();
  
  // Set up nested dropdowns
  setupNestedDropdowns();
  
  // Set up range input value displays
  setupRangeInputs();
}

/**
 * Set up main workflow step navigation
 */
function setupStepNavigation() {
  // Handle step submission buttons
  document.getElementById('goToStep1')?.addEventListener('click', function() {
    goToStep(1);
  });
  
  document.getElementById('uploadSubmit')?.addEventListener('click', function() {
    goToStep(2);
  });

  document.getElementById('goToStep2')?.addEventListener('click', function() {
    goToStep(2);
  });
  
  document.getElementById('goBackToStep2')?.addEventListener('click', function() {
    goToStep(2);
  });
 
  document.getElementById('step2Submit')?.addEventListener('click', function() {
    collectStep2DataAndSend()
  });
  
  document.getElementById('goToStep3')?.addEventListener('click', function() {
    goToStep(3);
  });
  
  document.getElementById('goBackToStep3')?.addEventListener('click', function() {
    goToStep(3);
  });
  
  document.getElementById('step3Submit')?.addEventListener('click', function() {
    // Simulate processing
    collectStep3DataAndSend()
  });
  
  document.getElementById('goToStep4')?.addEventListener('click', function() {
    goToStep(4);
  });
  
  document.getElementById('goBackToStep4')?.addEventListener('click', function() {
    goToStep(4);
  });
  
  document.getElementById('step4Submit')?.addEventListener('click', function() {
    // Simulate processing
    collectStep4DataAndSend()
  });
  
  document.getElementById('goToStep5')?.addEventListener('click', function() {
    goToStep(5);
    createEpitopeChart();
    
    // Mark step as complete
    document.querySelector('.step[data-step="5"]').classList.add('complete');
  });
  
  // Retry buttons for errors
  document.getElementById('retryStep2')?.addEventListener('click', function() {
    hideError('errorStep2');
    document.getElementById('step2Submit').click();
  });
  
  document.getElementById('retryStep3')?.addEventListener('click', function() {
    hideError('errorStep3');
    document.getElementById('step3Submit').click();
  });
  
  document.getElementById('retryStep4')?.addEventListener('click', function() {
    hideError('errorStep4');
    document.getElementById('step4Submit').click();
  });
}

/**
 * Navigate to a specific step in the workflow
 * @param {number} stepNumber - The step number to navigate to
 */
function goToStep(stepNumber) {
  // Update step indicators
  const steps = document.querySelectorAll('.step');
  steps.forEach(step => {
    const stepNum = parseInt(step.dataset.step);
    
    if (stepNum < stepNumber) {
      step.classList.add('complete');
      step.classList.remove('active');
    } else if (stepNum === stepNumber) {
      step.classList.add('active');
      step.classList.remove('complete');
    } else {
      step.classList.remove('active', 'complete');
    }
  });
  
  // Show the correct step content
  const stepContents = document.querySelectorAll('.step-content');
  stepContents.forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`step${stepNumber}`).classList.add('active');
  if (stepNumber === 2) {
    step1Upload()
  }  
}

document.querySelectorAll('.category-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Remove active class from all tabs
    document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));

    // Hide all category result divs
    document.querySelectorAll('.category-results').forEach(div => div.style.display = 'none');

    // Activate clicked tab and show corresponding result section
    tab.classList.add('active');
    const category = tab.getAttribute('data-category');
    document.getElementById('results-' + category).style.display = 'block';
  });
});

/**
 * Set up nested dropdown functionality
 */
// function setupNestedDropdowns() {
//   const parentDropdowns = document.querySelectorAll('.parent-dropdown');
  
//   parentDropdowns.forEach(dropdown => {
//     dropdown.addEventListener('change', function() {
//       const selectedValue = this.value;
//       const nestedDropdowns = this.closest('.substep').querySelectorAll('.nested-dropdown');
      
//       // Hide all nested dropdowns
//       nestedDropdowns.forEach(nestedDropdown => {
//         nestedDropdown.style.display = 'none';
//       });
      
//       // Show the correct nested dropdown
//       const targetDropdown = document.getElementById(`${selectedValue}-options`);
//       if (targetDropdown) {
//         targetDropdown.style.display = 'block';
//       }
//     });
    
//     // Trigger change event on load
//     dropdown.dispatchEvent(new Event('change'));
//   });
// }
// const alleleOptions = [
//   "DRB1*01:01",
//   "DRB1*03:01",
//   "DRB1*04:01",
//   "DRB1*07:01",
//   "DRB1*15:01"
// ];

// --------------------------MHC-I Allele Data--------------------------|
const alleleIMap = {
  "HLA-A01": [
    'HLA-A01:01','HLA-A01:02','HLA-A01:03','HLA-A01:04','HLA-A01:06','HLA-A01:07','HLA-A01:08','HLA-A01:09','HLA-A01:10','HLA-A01:100','HLA-A01:101','HLA-A01:102','HLA-A01:103','HLA-A01:104','HLA-A01:105','HLA-A01:106','HLA-A01:107','HLA-A01:108','HLA-A01:109','HLA-A01:110','HLA-A01:111','HLA-A01:112','HLA-A01:113','HLA-A01:114','HLA-A01:115','HLA-A01:116','HLA-A01:117','HLA-A01:118','HLA-A01:119','HLA-A01:12','HLA-A01:120','HLA-A01:121','HLA-A01:122','HLA-A01:124','HLA-A01:125','HLA-A01:126','HLA-A01:127','HLA-A01:128','HLA-A01:129','HLA-A01:13','HLA-A01:130','HLA-A01:131','HLA-A01:132','HLA-A01:133','HLA-A01:134','HLA-A01:135','HLA-A01:136','HLA-A01:137','HLA-A01:138','HLA-A01:139','HLA-A01:14','HLA-A01:140','HLA-A01:141','HLA-A01:142','HLA-A01:143','HLA-A01:144','HLA-A01:145','HLA-A01:146','HLA-A01:148','HLA-A01:149','HLA-A01:150','HLA-A01:151','HLA-A01:152','HLA-A01:153','HLA-A01:154','HLA-A01:155','HLA-A01:156','HLA-A01:157','HLA-A01:158','HLA-A01:159','HLA-A01:161','HLA-A01:163','HLA-A01:164',
    'HLA-A01:165','HLA-A01:166','HLA-A01:167','HLA-A01:168','HLA-A01:169','HLA-A01:17','HLA-A01:170','HLA-A01:171','HLA-A01:172','HLA-A01:173','HLA-A01:174','HLA-A01:175','HLA-A01:176','HLA-A01:177','HLA-A01:180','HLA-A01:181','HLA-A01:182','HLA-A01:183','HLA-A01:184','HLA-A01:185','HLA-A01:187','HLA-A01:188','HLA-A01:189','HLA-A01:19','HLA-A01:190','HLA-A01:191','HLA-A01:192','HLA-A01:193','HLA-A01:194','HLA-A01:195','HLA-A01:196','HLA-A01:197','HLA-A01:198','HLA-A01:199','HLA-A01:20','HLA-A01:200','HLA-A01:201','HLA-A01:202','HLA-A01:203','HLA-A01:204','HLA-A01:205','HLA-A01:206','HLA-A01:207','HLA-A01:209','HLA-A01:21','HLA-A01:210','HLA-A01:211','HLA-A01:212','HLA-A01:213','HLA-A01:214','HLA-A01:215','HLA-A01:216','HLA-A01:217','HLA-A01:218','HLA-A01:219','HLA-A01:220','HLA-A01:221','HLA-A01:222','HLA-A01:223','HLA-A01:224','HLA-A01:225','HLA-A01:226','HLA-A01:227','HLA-A01:229','HLA-A01:23','HLA-A01:230','HLA-A01:231','HLA-A01:232','HLA-A01:233','HLA-A01:234','HLA-A01:235','HLA-A01:236','HLA-A01:237',
    'HLA-A01:238','HLA-A01:239','HLA-A01:24','HLA-A01:241','HLA-A01:242','HLA-A01:243','HLA-A01:244','HLA-A01:245','HLA-A01:246','HLA-A01:249','HLA-A01:25','HLA-A01:251','HLA-A01:252','HLA-A01:253','HLA-A01:254','HLA-A01:255','HLA-A01:256','HLA-A01:257','HLA-A01:259','HLA-A01:26','HLA-A01:28','HLA-A01:29','HLA-A01:260','HLA-A01:261','HLA-A01:262','HLA-A01:263','HLA-A01:264','HLA-A01:265','HLA-A01:266','HLA-A01:267','HLA-A01:268','HLA-A01:270','HLA-A01:271','HLA-A01:272','HLA-A01:273','HLA-A01:274','HLA-A01:275','HLA-A01:276','HLA-A01:277','HLA-A01:278','HLA-A01:279','HLA-A01:280','HLA-A01:281','HLA-A01:282','HLA-A01:283','HLA-A01:284','HLA-A01:286','HLA-A01:288','HLA-A01:289','HLA-A01:291','HLA-A01:292','HLA-A01:294','HLA-A01:295','HLA-A01:296','HLA-A01:297','HLA-A01:30','HLA-A01:32','HLA-A01:33','HLA-A01:35','HLA-A01:36','HLA-A01:37','HLA-A01:38','HLA-A01:39','HLA-A01:40','HLA-A01:41','HLA-A01:42','HLA-A01:43','HLA-A01:44','HLA-A01:45','HLA-A01:46','HLA-A01:47','HLA-A01:48','HLA-A01:49','HLA-A01:50','HLA-A01:51',
    'HLA-A01:54','HLA-A01:55','HLA-A01:58','HLA-A01:59','HLA-A01:60','HLA-A01:61','HLA-A01:62','HLA-A01:63','HLA-A01:64','HLA-A01:65','HLA-A01:66','HLA-A01:67','HLA-A01:68','HLA-A01:69','HLA-A01:70','HLA-A01:71','HLA-A01:72','HLA-A01:73','HLA-A01:74','HLA-A01:75','HLA-A01:76','HLA-A01:77','HLA-A01:78','HLA-A01:79','HLA-A01:80','HLA-A01:81','HLA-A01:82','HLA-A01:83','HLA-A01:84','HLA-A01:85','HLA-A01:86','HLA-A01:88','HLA-A01:89','HLA-A01:90','HLA-A01:91','HLA-A01:92','HLA-A01:93','HLA-A01:94','HLA-A01:95','HLA-A01:96','HLA-A01:97','HLA-A01:98','HLA-A01:99'
    ],
  "HLA-A02": [
    'HLA-A02:01','HLA-A02:02','HLA-A02:03','HLA-A02:04','HLA-A02:05','HLA-A02:06','HLA-A02:07','HLA-A02:08','HLA-A02:09','HLA-A02:10','HLA-A02:101','HLA-A02:102','HLA-A02:103','HLA-A02:104','HLA-A02:105','HLA-A02:106','HLA-A02:107','HLA-A02:108','HLA-A02:109','HLA-A02:11','HLA-A02:110','HLA-A02:111','HLA-A02:112','HLA-A02:114','HLA-A02:115','HLA-A02:116','HLA-A02:117','HLA-A02:118','HLA-A02:119','HLA-A02:12','HLA-A02:120','HLA-A02:121','HLA-A02:122','HLA-A02:123','HLA-A02:124','HLA-A02:126','HLA-A02:127','HLA-A02:128','HLA-A02:129','HLA-A02:13','HLA-A02:130','HLA-A02:131','HLA-A02:132','HLA-A02:133','HLA-A02:134','HLA-A02:135','HLA-A02:136','HLA-A02:137','HLA-A02:138','HLA-A02:139','HLA-A02:14','HLA-A02:140','HLA-A02:141','HLA-A02:142','HLA-A02:143','HLA-A02:144','HLA-A02:145','HLA-A02:146','HLA-A02:147','HLA-A02:148','HLA-A02:149','HLA-A02:150','HLA-A02:151','HLA-A02:152','HLA-A02:153','HLA-A02:154','HLA-A02:155','HLA-A02:156','HLA-A02:157','HLA-A02:158','HLA-A02:159','HLA-A02:16','HLA-A02:160','HLA-A02:161',
    'HLA-A02:162','HLA-A02:163','HLA-A02:164','HLA-A02:165','HLA-A02:166','HLA-A02:167','HLA-A02:168','HLA-A02:169','HLA-A02:17','HLA-A02:170','HLA-A02:171','HLA-A02:172','HLA-A02:173','HLA-A02:174','HLA-A02:175','HLA-A02:176','HLA-A02:177','HLA-A02:178','HLA-A02:179','HLA-A02:18','HLA-A02:180','HLA-A02:181','HLA-A02:182','HLA-A02:183','HLA-A02:184','HLA-A02:185','HLA-A02:186','HLA-A02:187','HLA-A02:188','HLA-A02:189','HLA-A02:19','HLA-A02:190','HLA-A02:191','HLA-A02:192','HLA-A02:193','HLA-A02:194','HLA-A02:195','HLA-A02:196','HLA-A02:197','HLA-A02:198','HLA-A02:199','HLA-A02:20','HLA-A02:200','HLA-A02:201','HLA-A02:202','HLA-A02:203','HLA-A02:204','HLA-A02:205','HLA-A02:206','HLA-A02:207','HLA-A02:208','HLA-A02:209','HLA-A02:21','HLA-A02:210','HLA-A02:211','HLA-A02:212','HLA-A02:213','HLA-A02:214','HLA-A02:215','HLA-A02:216','HLA-A02:217','HLA-A02:218','HLA-A02:219','HLA-A02:22','HLA-A02:220','HLA-A02:221','HLA-A02:224','HLA-A02:228','HLA-A02:229','HLA-A02:230','HLA-A02:231','HLA-A02:232','HLA-A02:233','HLA-A02:234',
    'HLA-A02:235','HLA-A02:236','HLA-A02:237','HLA-A02:238','HLA-A02:239','HLA-A02:24','HLA-A02:240','HLA-A02:241','HLA-A02:242','HLA-A02:243','HLA-A02:244','HLA-A02:245','HLA-A02:246','HLA-A02:247','HLA-A02:248','HLA-A02:249','HLA-A02:25','HLA-A02:251','HLA-A02:252','HLA-A02:253','HLA-A02:254','HLA-A02:255','HLA-A02:256','HLA-A02:257','HLA-A02:258','HLA-A02:259','HLA-A02:26','HLA-A02:260','HLA-A02:261','HLA-A02:262','HLA-A02:263','HLA-A02:264','HLA-A02:265','HLA-A02:266','HLA-A02:267','HLA-A02:268','HLA-A02:269','HLA-A02:27','HLA-A02:270','HLA-A02:271','HLA-A02:272','HLA-A02:273','HLA-A02:274','HLA-A02:275','HLA-A02:276','HLA-A02:277','HLA-A02:278','HLA-A02:279','HLA-A02:28','HLA-A02:280','HLA-A02:281','HLA-A02:282','HLA-A02:283','HLA-A02:285','HLA-A02:286','HLA-A02:287','HLA-A02:288','HLA-A02:289','HLA-A02:29','HLA-A02:290','HLA-A02:291','HLA-A02:292','HLA-A02:294','HLA-A02:295','HLA-A02:296','HLA-A02:297','HLA-A02:298','HLA-A02:299','HLA-A02:30','HLA-A02:300','HLA-A02:302','HLA-A02:303','HLA-A02:304','HLA-A02:306',
    'HLA-A02:307','HLA-A02:308','HLA-A02:309','HLA-A02:31','HLA-A02:310','HLA-A02:311','HLA-A02:312','HLA-A02:313','HLA-A02:315','HLA-A02:316','HLA-A02:317','HLA-A02:318','HLA-A02:319','HLA-A02:320','HLA-A02:322','HLA-A02:323','HLA-A02:324','HLA-A02:325','HLA-A02:326','HLA-A02:327','HLA-A02:328','HLA-A02:329','HLA-A02:33','HLA-A02:330','HLA-A02:331','HLA-A02:332','HLA-A02:333','HLA-A02:334','HLA-A02:335','HLA-A02:336','HLA-A02:337','HLA-A02:338','HLA-A02:339','HLA-A02:34','HLA-A02:340','HLA-A02:341','HLA-A02:342','HLA-A02:343','HLA-A02:344','HLA-A02:345','HLA-A02:346','HLA-A02:347','HLA-A02:348','HLA-A02:349','HLA-A02:35','HLA-A02:351','HLA-A02:352','HLA-A02:353','HLA-A02:354','HLA-A02:355','HLA-A02:357','HLA-A02:358','HLA-A02:359','HLA-A02:36','HLA-A02:360','HLA-A02:361','HLA-A02:362','HLA-A02:363','HLA-A02:364','HLA-A02:365','HLA-A02:367','HLA-A02:368','HLA-A02:369','HLA-A02:37','HLA-A02:370','HLA-A02:371','HLA-A02:372','HLA-A02:374','HLA-A02:375','HLA-A02:376','HLA-A02:377','HLA-A02:378','HLA-A02:379','HLA-A02:38',
    'HLA-A02:380','HLA-A02:381','HLA-A02:382','HLA-A02:383','HLA-A02:384','HLA-A02:385','HLA-A02:386','HLA-A02:387','HLA-A02:388','HLA-A02:389','HLA-A02:39','HLA-A02:390','HLA-A02:391','HLA-A02:392','HLA-A02:393','HLA-A02:394','HLA-A02:396','HLA-A02:397','HLA-A02:398','HLA-A02:399','HLA-A02:40','HLA-A02:400','HLA-A02:401','HLA-A02:402','HLA-A02:403','HLA-A02:404','HLA-A02:405','HLA-A02:406','HLA-A02:407','HLA-A02:408','HLA-A02:409','HLA-A02:41','HLA-A02:410','HLA-A02:411','HLA-A02:412','HLA-A02:413','HLA-A02:414','HLA-A02:415','HLA-A02:416','HLA-A02:417','HLA-A02:418','HLA-A02:419','HLA-A02:42','HLA-A02:420','HLA-A02:421','HLA-A02:422','HLA-A02:423','HLA-A02:424','HLA-A02:425','HLA-A02:426','HLA-A02:427','HLA-A02:428','HLA-A02:429','HLA-A02:430','HLA-A02:431','HLA-A02:432','HLA-A02:433','HLA-A02:434','HLA-A02:435','HLA-A02:436','HLA-A02:437','HLA-A02:438','HLA-A02:44','HLA-A02:441','HLA-A02:442','HLA-A02:443','HLA-A02:444','HLA-A02:445','HLA-A02:446','HLA-A02:447','HLA-A02:448','HLA-A02:449','HLA-A02:45','HLA-A02:450',
    'HLA-A02:451','HLA-A02:452','HLA-A02:453','HLA-A02:454','HLA-A02:455','HLA-A02:456','HLA-A02:457','HLA-A02:458','HLA-A02:459','HLA-A02:46','HLA-A02:460','HLA-A02:461','HLA-A02:462','HLA-A02:463','HLA-A02:464','HLA-A02:465','HLA-A02:466','HLA-A02:467','HLA-A02:469','HLA-A02:47','HLA-A02:470','HLA-A02:471','HLA-A02:472','HLA-A02:473','HLA-A02:474','HLA-A02:475','HLA-A02:477','HLA-A02:478','HLA-A02:479','HLA-A02:48','HLA-A02:480','HLA-A02:481','HLA-A02:482','HLA-A02:483','HLA-A02:484','HLA-A02:485','HLA-A02:486','HLA-A02:487','HLA-A02:488','HLA-A02:489','HLA-A02:49','HLA-A02:491','HLA-A02:492','HLA-A02:493','HLA-A02:494','HLA-A02:495','HLA-A02:496','HLA-A02:497','HLA-A02:498','HLA-A02:499','HLA-A02:50','HLA-A02:502','HLA-A02:503','HLA-A02:504','HLA-A02:505','HLA-A02:507','HLA-A02:508','HLA-A02:509','HLA-A02:51','HLA-A02:510','HLA-A02:511','HLA-A02:512','HLA-A02:513','HLA-A02:515','HLA-A02:517','HLA-A02:518','HLA-A02:519','HLA-A02:52','HLA-A02:520','HLA-A02:521','HLA-A02:522','HLA-A02:523','HLA-A02:524','HLA-A02:526',
    'HLA-A02:527','HLA-A02:528','HLA-A02:529','HLA-A02:530','HLA-A02:531','HLA-A02:532','HLA-A02:533','HLA-A02:534','HLA-A02:535','HLA-A02:536','HLA-A02:537','HLA-A02:538','HLA-A02:539','HLA-A02:54','HLA-A02:541','HLA-A02:542','HLA-A02:543','HLA-A02:544','HLA-A02:545','HLA-A02:546','HLA-A02:547','HLA-A02:548','HLA-A02:549','HLA-A02:55','HLA-A02:550','HLA-A02:551','HLA-A02:552','HLA-A02:553','HLA-A02:554','HLA-A02:555','HLA-A02:556','HLA-A02:557','HLA-A02:558','HLA-A02:559','HLA-A02:56','HLA-A02:560','HLA-A02:561','HLA-A02:562','HLA-A02:563','HLA-A02:564','HLA-A02:565','HLA-A02:566','HLA-A02:567','HLA-A02:568','HLA-A02:569','HLA-A02:57','HLA-A02:570','HLA-A02:571','HLA-A02:572','HLA-A02:573','HLA-A02:574','HLA-A02:575','HLA-A02:576','HLA-A02:577','HLA-A02:578','HLA-A02:579','HLA-A02:58','HLA-A02:580','HLA-A02:581','HLA-A02:582','HLA-A02:583','HLA-A02:584','HLA-A02:585','HLA-A02:586','HLA-A02:587','HLA-A02:588','HLA-A02:589','HLA-A02:59','HLA-A02:590','HLA-A02:591','HLA-A02:592','HLA-A02:593','HLA-A02:594','HLA-A02:595',
    'HLA-A02:596','HLA-A02:597','HLA-A02:598','HLA-A02:599','HLA-A02:60','HLA-A02:600','HLA-A02:601','HLA-A02:602','HLA-A02:603','HLA-A02:604','HLA-A02:606','HLA-A02:607','HLA-A02:609','HLA-A02:61','HLA-A02:610','HLA-A02:611','HLA-A02:612','HLA-A02:613','HLA-A02:614','HLA-A02:615','HLA-A02:616','HLA-A02:617','HLA-A02:619','HLA-A02:62','HLA-A02:620','HLA-A02:621','HLA-A02:623','HLA-A02:624','HLA-A02:625','HLA-A02:626','HLA-A02:627','HLA-A02:628','HLA-A02:629','HLA-A02:63','HLA-A02:630','HLA-A02:631','HLA-A02:632','HLA-A02:633','HLA-A02:634','HLA-A02:635','HLA-A02:636','HLA-A02:637','HLA-A02:638','HLA-A02:639','HLA-A02:64','HLA-A02:640','HLA-A02:641','HLA-A02:642','HLA-A02:644','HLA-A02:645','HLA-A02:646','HLA-A02:647','HLA-A02:648','HLA-A02:649','HLA-A02:65','HLA-A02:650','HLA-A02:651','HLA-A02:652','HLA-A02:653','HLA-A02:654','HLA-A02:655','HLA-A02:656','HLA-A02:657','HLA-A02:658','HLA-A02:659','HLA-A02:66','HLA-A02:660','HLA-A02:661','HLA-A02:662','HLA-A02:663','HLA-A02:664','HLA-A02:665','HLA-A02:666','HLA-A02:667',
    'HLA-A02:668','HLA-A02:669','HLA-A02:67','HLA-A02:670','HLA-A02:671','HLA-A02:673','HLA-A02:674','HLA-A02:676','HLA-A02:677','HLA-A02:678','HLA-A02:679','HLA-A02:68','HLA-A02:680','HLA-A02:681','HLA-A02:682','HLA-A02:683','HLA-A02:684','HLA-A02:685','HLA-A02:686','HLA-A02:687','HLA-A02:688','HLA-A02:689','HLA-A02:69','HLA-A02:690','HLA-A02:692','HLA-A02:693','HLA-A02:694','HLA-A02:695','HLA-A02:697','HLA-A02:698','HLA-A02:699','HLA-A02:70','HLA-A02:700','HLA-A02:701','HLA-A02:702','HLA-A02:703','HLA-A02:704','HLA-A02:705','HLA-A02:706','HLA-A02:707','HLA-A02:708','HLA-A02:709','HLA-A02:71','HLA-A02:711','HLA-A02:712','HLA-A02:713','HLA-A02:714','HLA-A02:716','HLA-A02:717','HLA-A02:718','HLA-A02:719','HLA-A02:72','HLA-A02:720','HLA-A02:721','HLA-A02:722','HLA-A02:723','HLA-A02:724','HLA-A02:725','HLA-A02:726','HLA-A02:727','HLA-A02:728','HLA-A02:729','HLA-A02:73','HLA-A02:730','HLA-A02:731','HLA-A02:732','HLA-A02:733','HLA-A02:734','HLA-A02:735','HLA-A02:736','HLA-A02:737','HLA-A02:738','HLA-A02:739','HLA-A02:74',
    'HLA-A02:740','HLA-A02:741','HLA-A02:742','HLA-A02:743','HLA-A02:744','HLA-A02:745','HLA-A02:746','HLA-A02:747','HLA-A02:749','HLA-A02:75','HLA-A02:750','HLA-A02:751','HLA-A02:752','HLA-A02:753','HLA-A02:754','HLA-A02:755','HLA-A02:756','HLA-A02:757','HLA-A02:758','HLA-A02:759','HLA-A02:76','HLA-A02:761','HLA-A02:762','HLA-A02:763','HLA-A02:764','HLA-A02:765','HLA-A02:766','HLA-A02:767','HLA-A02:768','HLA-A02:769','HLA-A02:77','HLA-A02:770','HLA-A02:771','HLA-A02:772','HLA-A02:774','HLA-A02:776','HLA-A02:777','HLA-A02:778','HLA-A02:779','HLA-A02:78','HLA-A02:780','HLA-A02:781','HLA-A02:782','HLA-A02:783','HLA-A02:784','HLA-A02:785','HLA-A02:786','HLA-A02:787','HLA-A02:79','HLA-A02:790','HLA-A02:794','HLA-A02:795','HLA-A02:798','HLA-A02:799','HLA-A02:80','HLA-A02:800','HLA-A02:801','HLA-A02:802','HLA-A02:804','HLA-A02:808','HLA-A02:809','HLA-A02:81','HLA-A02:810','HLA-A02:811','HLA-A02:812','HLA-A02:813','HLA-A02:814','HLA-A02:815','HLA-A02:816','HLA-A02:817','HLA-A02:818','HLA-A02:819','HLA-A02:820','HLA-A02:821',
    'HLA-A02:822','HLA-A02:823','HLA-A02:824','HLA-A02:825','HLA-A02:84','HLA-A02:85','HLA-A02:86','HLA-A02:87','HLA-A02:89','HLA-A02:90','HLA-A02:91','HLA-A02:92','HLA-A02:93','HLA-A02:95','HLA-A02:96','HLA-A02:97','HLA-A02:99'
    ],
  "HLA-A03": [
    "HLA-A03:01", "HLA-A03:02", "HLA-A03:04", "HLA-A03:05", "HLA-A03:06", "HLA-A03:07", "HLA-A03:08", "HLA-A03:09","HLA-A03:10", "HLA-A03:100", "HLA-A03:101", "HLA-A03:102", "HLA-A03:103", "HLA-A03:104", "HLA-A03:105", "HLA-A03:106","HLA-A03:107", "HLA-A03:108", "HLA-A03:109", "HLA-A03:110", "HLA-A03:111", "HLA-A03:112", "HLA-A03:113", "HLA-A03:114","HLA-A03:115", "HLA-A03:116", "HLA-A03:117", "HLA-A03:118", "HLA-A03:119", "HLA-A03:12", "HLA-A03:120", "HLA-A03:121",
    "HLA-A03:122", "HLA-A03:123", "HLA-A03:124", "HLA-A03:125", "HLA-A03:126", "HLA-A03:127", "HLA-A03:128", "HLA-A03:13","HLA-A03:130", "HLA-A03:131", "HLA-A03:132", "HLA-A03:133", "HLA-A03:134", "HLA-A03:135", "HLA-A03:136", "HLA-A03:137","HLA-A03:138", "HLA-A03:139", "HLA-A03:14", "HLA-A03:140", "HLA-A03:141", "HLA-A03:142", "HLA-A03:143", "HLA-A03:144","HLA-A03:145", "HLA-A03:146", "HLA-A03:147", "HLA-A03:148", "HLA-A03:149", "HLA-A03:15", "HLA-A03:150", "HLA-A03:151",
    "HLA-A03:152", "HLA-A03:153", "HLA-A03:154", "HLA-A03:155", "HLA-A03:156", "HLA-A03:157", "HLA-A03:158", "HLA-A03:159","HLA-A03:16", "HLA-A03:160", "HLA-A03:163", "HLA-A03:164", "HLA-A03:165", "HLA-A03:166", "HLA-A03:167", "HLA-A03:169","HLA-A03:17", "HLA-A03:170", "HLA-A03:171", "HLA-A03:172", "HLA-A03:173", "HLA-A03:174", "HLA-A03:175", "HLA-A03:176","HLA-A03:177", "HLA-A03:179", "HLA-A03:18", "HLA-A03:180", "HLA-A03:181", "HLA-A03:182", "HLA-A03:183", "HLA-A03:184",
    "HLA-A03:185", "HLA-A03:186", "HLA-A03:187", "HLA-A03:188", "HLA-A03:189", "HLA-A03:19", "HLA-A03:190", "HLA-A03:191","HLA-A03:193", "HLA-A03:195", "HLA-A03:196", "HLA-A03:198", "HLA-A03:199", "HLA-A03:20", "HLA-A03:201", "HLA-A03:202","HLA-A03:203", "HLA-A03:204", "HLA-A03:205", "HLA-A03:206", "HLA-A03:207", "HLA-A03:208", "HLA-A03:209", "HLA-A03:210","HLA-A03:211", "HLA-A03:212", "HLA-A03:213", "HLA-A03:214", "HLA-A03:215", "HLA-A03:216", "HLA-A03:217", "HLA-A03:218",
    "HLA-A03:219", "HLA-A03:22", "HLA-A03:220", "HLA-A03:221", "HLA-A03:222", "HLA-A03:223", "HLA-A03:224", "HLA-A03:225","HLA-A03:226", "HLA-A03:227", "HLA-A03:228", "HLA-A03:229", "HLA-A03:23", "HLA-A03:230", "HLA-A03:231", "HLA-A03:232","HLA-A03:233", "HLA-A03:235", "HLA-A03:236", "HLA-A03:237", "HLA-A03:238", "HLA-A03:239", "HLA-A03:24", "HLA-A03:240","HLA-A03:241", "HLA-A03:242", "HLA-A03:243", "HLA-A03:244", "HLA-A03:245", "HLA-A03:246", "HLA-A03:247", "HLA-A03:248",
    "HLA-A03:249", "HLA-A03:25", "HLA-A03:250", "HLA-A03:251", "HLA-A03:252", "HLA-A03:253", "HLA-A03:254", "HLA-A03:255","HLA-A03:256", "HLA-A03:257", "HLA-A03:258", "HLA-A03:259", "HLA-A03:26", "HLA-A03:260", "HLA-A03:261", "HLA-A03:263","HLA-A03:264", "HLA-A03:265", "HLA-A03:267", "HLA-A03:268", "HLA-A03:27", "HLA-A03:270", "HLA-A03:271", "HLA-A03:272","HLA-A03:273", "HLA-A03:274", "HLA-A03:276", "HLA-A03:277", "HLA-A03:278", "HLA-A03:28", "HLA-A03:280", "HLA-A03:281",
    "HLA-A03:282", "HLA-A03:285", "HLA-A03:287", "HLA-A03:288", "HLA-A03:289", "HLA-A03:29", "HLA-A03:290", "HLA-A03:291","HLA-A03:292", "HLA-A03:293", "HLA-A03:294", "HLA-A03:295", "HLA-A03:296", "HLA-A03:298", "HLA-A03:299", "HLA-A03:30","HLA-A03:300", "HLA-A03:301", "HLA-A03:302", "HLA-A03:303", "HLA-A03:304", "HLA-A03:305", "HLA-A03:306", "HLA-A03:307","HLA-A03:308", "HLA-A03:309", "HLA-A03:31", "HLA-A03:310", "HLA-A03:311", "HLA-A03:312", "HLA-A03:313", "HLA-A03:314",
    "HLA-A03:315", "HLA-A03:316", "HLA-A03:317", "HLA-A03:318", "HLA-A03:319", "HLA-A03:32", "HLA-A03:320", "HLA-A03:321","HLA-A03:322", "HLA-A03:324", "HLA-A03:325", "HLA-A03:326", "HLA-A03:327", "HLA-A03:328", "HLA-A03:33", "HLA-A03:331","HLA-A03:332", "HLA-A03:333", "HLA-A03:34", "HLA-A03:35", "HLA-A03:37", "HLA-A03:38", "HLA-A03:39", "HLA-A03:40"
  ],
  "HLA-A11": [
    "HLA-A11:01", "HLA-A11:02", "HLA-A11:03", "HLA-A11:04", "HLA-A11:05", "HLA-A11:06","HLA-A11:07", "HLA-A11:08", "HLA-A11:09", "HLA-A11:10", "HLA-A11:100", "HLA-A11:101","HLA-A11:102", "HLA-A11:103", "HLA-A11:104", "HLA-A11:105", "HLA-A11:106", "HLA-A11:107","HLA-A11:108", "HLA-A11:11", "HLA-A11:110", "HLA-A11:111", "HLA-A11:112", "HLA-A11:113",
    "HLA-A11:114", "HLA-A11:116", "HLA-A11:117", "HLA-A11:118", "HLA-A11:119", "HLA-A11:12","HLA-A11:120", "HLA-A11:121", "HLA-A11:122", "HLA-A11:123", "HLA-A11:124", "HLA-A11:125","HLA-A11:126", "HLA-A11:128", "HLA-A11:129", "HLA-A11:13", "HLA-A11:130", "HLA-A11:131","HLA-A11:132", "HLA-A11:133", "HLA-A11:134", "HLA-A11:135", "HLA-A11:136", "HLA-A11:138",
    "HLA-A11:139", "HLA-A11:14", "HLA-A11:140", "HLA-A11:141", "HLA-A11:142", "HLA-A11:143","HLA-A11:144", "HLA-A11:145", "HLA-A11:146", "HLA-A11:147", "HLA-A11:148", "HLA-A11:149","HLA-A11:15", "HLA-A11:150", "HLA-A11:151", "HLA-A11:152", "HLA-A11:153", "HLA-A11:154","HLA-A11:155", "HLA-A11:156", "HLA-A11:157", "HLA-A11:158", "HLA-A11:159", "HLA-A11:16",
    "HLA-A11:160", "HLA-A11:161", "HLA-A11:162", "HLA-A11:163", "HLA-A11:164", "HLA-A11:165","HLA-A11:166", "HLA-A11:167", "HLA-A11:168", "HLA-A11:169", "HLA-A11:17", "HLA-A11:171","HLA-A11:172", "HLA-A11:173", "HLA-A11:174", "HLA-A11:175", "HLA-A11:176", "HLA-A11:177","HLA-A11:178", "HLA-A11:179", "HLA-A11:18", "HLA-A11:181", "HLA-A11:183", "HLA-A11:184",
    "HLA-A11:185", "HLA-A11:186", "HLA-A11:187", "HLA-A11:188", "HLA-A11:189", "HLA-A11:19","HLA-A11:190", "HLA-A11:191", "HLA-A11:192", "HLA-A11:193", "HLA-A11:194", "HLA-A11:195","HLA-A11:196", "HLA-A11:197", "HLA-A11:198", "HLA-A11:199", "HLA-A11:20", "HLA-A11:200","HLA-A11:201", "HLA-A11:202", "HLA-A11:203", "HLA-A11:204", "HLA-A11:205", "HLA-A11:206",
    "HLA-A11:207", "HLA-A11:209", "HLA-A11:211", "HLA-A11:212", "HLA-A11:213", "HLA-A11:214","HLA-A11:216", "HLA-A11:217", "HLA-A11:218", "HLA-A11:219", "HLA-A11:22", "HLA-A11:220","HLA-A11:221", "HLA-A11:222", "HLA-A11:223", "HLA-A11:224", "HLA-A11:225", "HLA-A11:226","HLA-A11:227", "HLA-A11:228", "HLA-A11:229", "HLA-A11:23", "HLA-A11:230", "HLA-A11:231",
    "HLA-A11:232", "HLA-A11:233", "HLA-A11:234", "HLA-A11:236", "HLA-A11:237", "HLA-A11:239","HLA-A11:24", "HLA-A11:240", "HLA-A11:241", "HLA-A11:242", "HLA-A11:243", "HLA-A11:244","HLA-A11:245", "HLA-A11:246", "HLA-A11:247", "HLA-A11:248", "HLA-A11:249", "HLA-A11:25","HLA-A11:250", "HLA-A11:252", "HLA-A11:253", "HLA-A11:254", "HLA-A11:255", "HLA-A11:257",
    "HLA-A11:258", "HLA-A11:259", "HLA-A11:26", "HLA-A11:260", "HLA-A11:261", "HLA-A11:262","HLA-A11:263", "HLA-A11:264", "HLA-A11:265", "HLA-A11:266", "HLA-A11:267", "HLA-A11:268","HLA-A11:269", "HLA-A11:27", "HLA-A11:270", "HLA-A11:271", "HLA-A11:273", "HLA-A11:274","HLA-A11:275", "HLA-A11:276", "HLA-A11:277", "HLA-A11:278", "HLA-A11:279", "HLA-A11:280",
    "HLA-A11:281", "HLA-A11:282", "HLA-A11:283", "HLA-A11:284", "HLA-A11:285", "HLA-A11:286","HLA-A11:288", "HLA-A11:289", "HLA-A11:29", "HLA-A11:290", "HLA-A11:291", "HLA-A11:292","HLA-A11:293", "HLA-A11:294", "HLA-A11:295", "HLA-A11:296", "HLA-A11:297", "HLA-A11:298","HLA-A11:299", "HLA-A11:30", "HLA-A11:300", "HLA-A11:301", "HLA-A11:302", "HLA-A11:303",
    "HLA-A11:304", "HLA-A11:305", "HLA-A11:306", "HLA-A11:307", "HLA-A11:308", "HLA-A11:309","HLA-A11:31", "HLA-A11:311", "HLA-A11:312", "HLA-A11:32", "HLA-A11:33", "HLA-A11:34","HLA-A11:35", "HLA-A11:36", "HLA-A11:37", "HLA-A11:38", "HLA-A11:39", "HLA-A11:40","HLA-A11:41", "HLA-A11:42", "HLA-A11:43", "HLA-A11:44", "HLA-A11:45", "HLA-A11:46",
    "HLA-A11:47", "HLA-A11:48", "HLA-A11:49", "HLA-A11:51", "HLA-A11:53", "HLA-A11:54","HLA-A11:55", "HLA-A11:56", "HLA-A11:57", "HLA-A11:58", "HLA-A11:59", "HLA-A11:60"
  ],
  "HLA-A23": [
    "HLA-A23:01", "HLA-A23:02", "HLA-A23:03", "HLA-A23:04", "HLA-A23:05", "HLA-A23:06", "HLA-A23:09","HLA-A23:10", "HLA-A23:12", "HLA-A23:13", "HLA-A23:14", "HLA-A23:15", "HLA-A23:16", "HLA-A23:17",
    "HLA-A23:18", "HLA-A23:20", "HLA-A23:21", "HLA-A23:22", "HLA-A23:23", "HLA-A23:24", "HLA-A23:25","HLA-A23:26", "HLA-A23:27", "HLA-A23:28", "HLA-A23:29", "HLA-A23:30", "HLA-A23:31", "HLA-A23:32",
    "HLA-A23:33", "HLA-A23:34", "HLA-A23:35", "HLA-A23:36", "HLA-A23:37", "HLA-A23:39", "HLA-A23:40","HLA-A23:41", "HLA-A23:42", "HLA-A23:43", "HLA-A23:44", "HLA-A23:45", "HLA-A23:46", "HLA-A23:47",
    "HLA-A23:48", "HLA-A23:49", "HLA-A23:50", "HLA-A23:51", "HLA-A23:52", "HLA-A23:53", "HLA-A23:54","HLA-A23:55", "HLA-A23:56", "HLA-A23:57", "HLA-A23:58", "HLA-A23:59", "HLA-A23:60", "HLA-A23:61",
    "HLA-A23:62", "HLA-A23:63", "HLA-A23:64", "HLA-A23:65", "HLA-A23:66", "HLA-A23:67", "HLA-A23:68","HLA-A23:70", "HLA-A23:71", "HLA-A23:72", "HLA-A23:73", "HLA-A23:74", "HLA-A23:75", "HLA-A23:76",
    "HLA-A23:77", "HLA-A23:78", "HLA-A23:79", "HLA-A23:80", "HLA-A23:81", "HLA-A23:82", "HLA-A23:83","HLA-A23:85", "HLA-A23:86", "HLA-A23:87", "HLA-A23:88", "HLA-A23:89", "HLA-A23:90", "HLA-A23:92"
  ],
  "HLA-A24": [
    "HLA-A24:02", "HLA-A24:03", "HLA-A24:04", "HLA-A24:05", "HLA-A24:06","HLA-A24:07", "HLA-A24:08", "HLA-A24:10", "HLA-A24:100", "HLA-A24:101","HLA-A24:102", "HLA-A24:103", "HLA-A24:104", "HLA-A24:105", "HLA-A24:106","HLA-A24:107", "HLA-A24:108", "HLA-A24:109", "HLA-A24:110", "HLA-A24:111",
    "HLA-A24:112", "HLA-A24:113", "HLA-A24:114", "HLA-A24:115", "HLA-A24:116","HLA-A24:117", "HLA-A24:118", "HLA-A24:119", "HLA-A24:120", "HLA-A24:121","HLA-A24:122", "HLA-A24:123", "HLA-A24:124", "HLA-A24:125", "HLA-A24:126","HLA-A24:127", "HLA-A24:128", "HLA-A24:129", "HLA-A24:13", "HLA-A24:130",
    "HLA-A24:131", "HLA-A24:133", "HLA-A24:134", "HLA-A24:135", "HLA-A24:136","HLA-A24:137", "HLA-A24:138", "HLA-A24:139", "HLA-A24:14", "HLA-A24:140","HLA-A24:141", "HLA-A24:142", "HLA-A24:143", "HLA-A24:144", "HLA-A24:145","HLA-A24:146", "HLA-A24:147", "HLA-A24:148", "HLA-A24:149", "HLA-A24:15",
    "HLA-A24:150", "HLA-A24:151", "HLA-A24:152", "HLA-A24:153", "HLA-A24:154","HLA-A24:156", "HLA-A24:157", "HLA-A24:159", "HLA-A24:160", "HLA-A24:161","HLA-A24:162", "HLA-A24:164", "HLA-A24:165", "HLA-A24:166", "HLA-A24:167","HLA-A24:168", "HLA-A24:169", "HLA-A24:17", "HLA-A24:170", "HLA-A24:171",
    "HLA-A24:172", "HLA-A24:173", "HLA-A24:174", "HLA-A24:175", "HLA-A24:176","HLA-A24:177", "HLA-A24:178", "HLA-A24:179", "HLA-A24:18", "HLA-A24:180","HLA-A24:181", "HLA-A24:182", "HLA-A24:184", "HLA-A24:186", "HLA-A24:187","HLA-A24:188", "HLA-A24:189", "HLA-A24:19", "HLA-A24:190", "HLA-A24:191",
    "HLA-A24:192", "HLA-A24:193", "HLA-A24:194", "HLA-A24:195", "HLA-A24:196","HLA-A24:197", "HLA-A24:198", "HLA-A24:199", "HLA-A24:20", "HLA-A24:200","HLA-A24:201", "HLA-A24:202", "HLA-A24:203", "HLA-A24:204", "HLA-A24:205","HLA-A24:206", "HLA-A24:207", "HLA-A24:208", "HLA-A24:209", "HLA-A24:21",
    "HLA-A24:210", "HLA-A24:212", "HLA-A24:213", "HLA-A24:214", "HLA-A24:215","HLA-A24:216", "HLA-A24:217", "HLA-A24:218", "HLA-A24:219", "HLA-A24:22","HLA-A24:220", "HLA-A24:221", "HLA-A24:223", "HLA-A24:224", "HLA-A24:225","HLA-A24:226", "HLA-A24:227", "HLA-A24:228", "HLA-A24:229", "HLA-A24:23"
  ],
  "HLA-A25": [
    "HLA-A25:01", "HLA-A25:02", "HLA-A25:03", "HLA-A25:04", "HLA-A25:05","HLA-A25:06", "HLA-A25:07", "HLA-A25:08", "HLA-A25:09", "HLA-A25:10", 
    "HLA-A25:11", "HLA-A25:13", "HLA-A25:14", "HLA-A25:15", "HLA-A25:16","HLA-A25:17", "HLA-A25:18", "HLA-A25:19", "HLA-A25:20", "HLA-A25:21",
    "HLA-A25:22", "HLA-A25:23", "HLA-A25:24", "HLA-A25:25", "HLA-A25:26","HLA-A25:27", "HLA-A25:28", "HLA-A25:29", "HLA-A25:30", "HLA-A25:31", 
    "HLA-A25:32", "HLA-A25:33", "HLA-A25:34", "HLA-A25:35", "HLA-A25:36","HLA-A25:37", "HLA-A25:38", "HLA-A25:39", "HLA-A25:40", "HLA-A25:41", 
    "HLA-A25:43", "HLA-A25:44", "HLA-A25:45", "HLA-A25:46", "HLA-A25:47","HLA-A25:48", "HLA-A25:50", "HLA-A25:51", "HLA-A25:52", "HLA-A25:53", 
    "HLA-A25:54", "HLA-A25:55", "HLA-A25:56", "HLA-A25:57"
  ],
  "HLA-A26": [
    "HLA-A26:01", "HLA-A26:02", "HLA-A26:03", "HLA-A26:04", "HLA-A26:05","HLA-A26:06", "HLA-A26:07", "HLA-A26:08", "HLA-A26:09", "HLA-A26:10","HLA-A26:100", "HLA-A26:101", "HLA-A26:102", "HLA-A26:103", "HLA-A26:104","HLA-A26:105", "HLA-A26:106", "HLA-A26:108", "HLA-A26:109", "HLA-A26:110",
    "HLA-A26:111", "HLA-A26:112", "HLA-A26:113", "HLA-A26:114", "HLA-A26:115","HLA-A26:116", "HLA-A26:117", "HLA-A26:118", "HLA-A26:119", "HLA-A26:12","HLA-A26:120", "HLA-A26:121", "HLA-A26:122", "HLA-A26:123", "HLA-A26:124","HLA-A26:125", "HLA-A26:126", "HLA-A26:128", "HLA-A26:129", "HLA-A26:13",
    "HLA-A26:130", "HLA-A26:131", "HLA-A26:132", "HLA-A26:133", "HLA-A26:134","HLA-A26:135", "HLA-A26:136", "HLA-A26:137", "HLA-A26:138", "HLA-A26:139","HLA-A26:14", "HLA-A26:140", "HLA-A26:141", "HLA-A26:142", "HLA-A26:143","HLA-A26:144", "HLA-A26:146", "HLA-A26:147", "HLA-A26:148", "HLA-A26:149",
    "HLA-A26:15", "HLA-A26:150", "HLA-A26:151", "HLA-A26:152", "HLA-A26:153","HLA-A26:154", "HLA-A26:155", "HLA-A26:156", "HLA-A26:157", "HLA-A26:158","HLA-A26:159", "HLA-A26:16", "HLA-A26:160", "HLA-A26:162", "HLA-A26:163","HLA-A26:164", "HLA-A26:165", "HLA-A26:167", "HLA-A26:168", "HLA-A26:169",
    "HLA-A26:17", "HLA-A26:170", "HLA-A26:171", "HLA-A26:172", "HLA-A26:173","HLA-A26:174", "HLA-A26:175", "HLA-A26:176", "HLA-A26:177", "HLA-A26:178","HLA-A26:18", "HLA-A26:19", "HLA-A26:20", "HLA-A26:21", "HLA-A26:22","HLA-A26:23", "HLA-A26:24", "HLA-A26:26", "HLA-A26:27", "HLA-A26:28",
    "HLA-A26:29", "HLA-A26:30", "HLA-A26:31", "HLA-A26:32", "HLA-A26:33","HLA-A26:34", "HLA-A26:35", "HLA-A26:36", "HLA-A26:37", "HLA-A26:38","HLA-A26:39", "HLA-A26:40", "HLA-A26:41", "HLA-A26:42", "HLA-A26:43","HLA-A26:45", "HLA-A26:46", "HLA-A26:47", "HLA-A26:48", "HLA-A26:49",
    "HLA-A26:50", "HLA-A26:51", "HLA-A26:52", "HLA-A26:53", "HLA-A26:54","HLA-A26:55", "HLA-A26:56", "HLA-A26:57", "HLA-A26:58", "HLA-A26:59","HLA-A26:61", "HLA-A26:62", "HLA-A26:63", "HLA-A26:64", "HLA-A26:65","HLA-A26:66", "HLA-A26:67", "HLA-A26:68", "HLA-A26:69", "HLA-A26:70",
    "HLA-A26:72", "HLA-A26:73", "HLA-A26:74", "HLA-A26:75", "HLA-A26:76","HLA-A26:77", "HLA-A26:78", "HLA-A26:79", "HLA-A26:80", "HLA-A26:81","HLA-A26:82", "HLA-A26:83", "HLA-A26:84", "HLA-A26:85", "HLA-A26:86","HLA-A26:87", "HLA-A26:88", "HLA-A26:89", "HLA-A26:90", "HLA-A26:91",
    "HLA-A26:92", "HLA-A26:93", "HLA-A26:94", "HLA-A26:95", "HLA-A26:96","HLA-A26:97", "HLA-A26:98", "HLA-A26:99"
  ],
  "HLA-A29": [
    "HLA-A29:01", "HLA-A29:02", "HLA-A29:03", "HLA-A29:04", "HLA-A29:05","HLA-A29:06", "HLA-A29:07", "HLA-A29:09", "HLA-A29:10", "HLA-A29:100","HLA-A29:101", "HLA-A29:102", "HLA-A29:103", "HLA-A29:104", "HLA-A29:105","HLA-A29:106", "HLA-A29:107", "HLA-A29:108", "HLA-A29:109", "HLA-A29:11",
    "HLA-A29:110", "HLA-A29:111", "HLA-A29:113", "HLA-A29:114", "HLA-A29:115","HLA-A29:116", "HLA-A29:117", "HLA-A29:118", "HLA-A29:119", "HLA-A29:12","HLA-A29:120", "HLA-A29:121", "HLA-A29:122", "HLA-A29:123", "HLA-A29:124","HLA-A29:125", "HLA-A29:127", "HLA-A29:128", "HLA-A29:13", "HLA-A29:14",
    "HLA-A29:15", "HLA-A29:16", "HLA-A29:17", "HLA-A29:18", "HLA-A29:19","HLA-A29:20", "HLA-A29:21", "HLA-A29:22", "HLA-A29:23", "HLA-A29:24","HLA-A29:25", "HLA-A29:26", "HLA-A29:27", "HLA-A29:28", "HLA-A29:29","HLA-A29:30", "HLA-A29:31", "HLA-A29:32", "HLA-A29:33", "HLA-A29:34",
    "HLA-A29:35", "HLA-A29:36", "HLA-A29:37", "HLA-A29:38", "HLA-A29:39","HLA-A29:40", "HLA-A29:41", "HLA-A29:42", "HLA-A29:43", "HLA-A29:44","HLA-A29:45", "HLA-A29:46", "HLA-A29:47", "HLA-A29:48", "HLA-A29:49","HLA-A29:50", "HLA-A29:51", "HLA-A29:52", "HLA-A29:53", "HLA-A29:54",
    "HLA-A29:55", "HLA-A29:56", "HLA-A29:57", "HLA-A29:58", "HLA-A29:59","HLA-A29:60", "HLA-A29:61", "HLA-A29:62", "HLA-A29:63", "HLA-A29:64","HLA-A29:65", "HLA-A29:66", "HLA-A29:67", "HLA-A29:68", "HLA-A29:69","HLA-A29:70", "HLA-A29:71", "HLA-A29:72", "HLA-A29:73", "HLA-A29:74",
    "HLA-A29:75", "HLA-A29:76", "HLA-A29:77", "HLA-A29:79", "HLA-A29:80","HLA-A29:81", "HLA-A29:82", "HLA-A29:83", "HLA-A29:84", "HLA-A29:85","HLA-A29:86", "HLA-A29:87", "HLA-A29:88", "HLA-A29:89", "HLA-A29:90","HLA-A29:91", "HLA-A29:92", "HLA-A29:93", "HLA-A29:94", "HLA-A29:95",
    "HLA-A29:96", "HLA-A29:97", "HLA-A29:98", "HLA-A29:99"
  ],
  "HLA-A30": [
    "HLA-A30:01", "HLA-A30:02", "HLA-A30:03", "HLA-A30:04", "HLA-A30:06","HLA-A30:07", "HLA-A30:08", "HLA-A30:09", "HLA-A30:10", "HLA-A30:100","HLA-A30:102", "HLA-A30:103", "HLA-A30:104", "HLA-A30:105", "HLA-A30:106","HLA-A30:107", "HLA-A30:108", "HLA-A30:109", "HLA-A30:11", "HLA-A30:110",
    "HLA-A30:111", "HLA-A30:112", "HLA-A30:113", "HLA-A30:114", "HLA-A30:115","HLA-A30:116", "HLA-A30:117", "HLA-A30:118", "HLA-A30:119", "HLA-A30:12","HLA-A30:120", "HLA-A30:122", "HLA-A30:124", "HLA-A30:125", "HLA-A30:126","HLA-A30:127", "HLA-A30:128", "HLA-A30:129", "HLA-A30:13", "HLA-A30:131",
    "HLA-A30:133", "HLA-A30:134", "HLA-A30:135", "HLA-A30:136", "HLA-A30:137","HLA-A30:138", "HLA-A30:139", "HLA-A30:140", "HLA-A30:141", "HLA-A30:142","HLA-A30:143", "HLA-A30:144", "HLA-A30:15", "HLA-A30:16", "HLA-A30:17","HLA-A30:18", "HLA-A30:19", "HLA-A30:20", "HLA-A30:22", "HLA-A30:23",
    "HLA-A30:24", "HLA-A30:25", "HLA-A30:26", "HLA-A30:28", "HLA-A30:29","HLA-A30:30", "HLA-A30:31", "HLA-A30:32", "HLA-A30:33", "HLA-A30:34","HLA-A30:35", "HLA-A30:36", "HLA-A30:37", "HLA-A30:38", "HLA-A30:39","HLA-A30:40", "HLA-A30:41", "HLA-A30:42", "HLA-A30:43", "HLA-A30:44",
    "HLA-A30:45", "HLA-A30:46", "HLA-A30:47", "HLA-A30:48", "HLA-A30:49","HLA-A30:50", "HLA-A30:51", "HLA-A30:52", "HLA-A30:53", "HLA-A30:54","HLA-A30:55", "HLA-A30:56", "HLA-A30:57", "HLA-A30:58", "HLA-A30:60","HLA-A30:61", "HLA-A30:62", "HLA-A30:63", "HLA-A30:64", "HLA-A30:65",
    "HLA-A30:66", "HLA-A30:67", "HLA-A30:68", "HLA-A30:69", "HLA-A30:71","HLA-A30:72", "HLA-A30:74", "HLA-A30:75", "HLA-A30:77", "HLA-A30:79","HLA-A30:80", "HLA-A30:81", "HLA-A30:82", "HLA-A30:83", "HLA-A30:84","HLA-A30:85", "HLA-A30:86", "HLA-A30:87", "HLA-A30:88", "HLA-A30:89",
    "HLA-A30:90", "HLA-A30:91", "HLA-A30:92", "HLA-A30:93", "HLA-A30:94","HLA-A30:95", "HLA-A30:96", "HLA-A30:97", "HLA-A30:98", "HLA-A30:99"
  ],
};
// ------------------------------------End MHC-I Alleles------------------------------------|
// ------------------------------------Start MHC-II Alleles------------------------------------|

const alleleIIMap = {
  "DRB1": [
    "DRB1_0101","DRB1_0102","DRB1_0103","DRB1_0104","DRB1_0105","DRB1_0106","DRB1_0107","DRB1_0108","DRB1_0109","DRB1_0110","DRB1_0111","DRB1_0112","DRB1_0113","DRB1_0114","DRB1_0115","DRB1_0116","DRB1_0117","DRB1_0118","DRB1_0119","DRB1_0120","DRB1_0121","DRB1_0122","DRB1_0123","DRB1_0124","DRB1_0125","DRB1_0126","DRB1_0127","DRB1_0128","DRB1_0450","DRB1_0451","DRB1_0452","DRB1_0453","DRB1_0454","DRB1_0455","DRB1_0456","DRB1_0457","DRB1_0458","DRB1_0459","DRB1_0460","DRB1_0461","DRB1_0462","DRB1_0463","DRB1_0464","DRB1_0465","DRB1_0466","DRB1_0467","DRB1_0468","DRB1_0469","DRB1_0470","DRB1_0471","DRB1_0472","DRB1_0473","DRB1_0474","DRB1_0475","DRB1_0476","DRB1_0477","DRB1_0478","DRB1_0479","DRB1_0480","DRB1_0482","DRB1_0483","DRB1_0484","DRB1_0485","DRB1_0486",
    "DRB1_0487","DRB1_0488","DRB1_0489","DRB1_0491","DRB1_0701","DRB1_0703","DRB1_0704","DRB1_0705","DRB1_0706","DRB1_0707","DRB1_0708","DRB1_0709","DRB1_0711","DRB1_0712","DRB1_0713","DRB1_0714","DRB1_0715","DRB1_0716","DRB1_0717","DRB1_0719","DRB1_0801","DRB1_0802","DRB1_0803","DRB1_0804","DRB1_0805","DRB1_0806","DRB1_0807","DRB1_0808","DRB1_0809","DRB1_0810","DRB1_0811","DRB1_0812","DRB1_0813","DRB1_0814","DRB1_0815","DRB1_0816","DRB1_0818","DRB1_0819","DRB1_0820","DRB1_0821","DRB1_0822","DRB1_0823","DRB1_0824","DRB1_0825","DRB1_0826","DRB1_0827","DRB1_0828","DRB1_0829","DRB1_0830","DRB1_0831","DRB1_0832","DRB1_0833","DRB1_0834","DRB1_0835","DRB1_0836","DRB1_0837","DRB1_0838","DRB1_0839","DRB1_0840","DRB1_0901","DRB1_0902","DRB1_0903","DRB1_0904","DRB1_0905",
    "DRB1_0906","DRB1_0907","DRB1_0908","DRB1_0909","DRB1_1001","DRB1_1002","DRB1_1003","DRB1_1101","DRB1_1102","DRB1_1103","DRB1_1104","DRB1_1105","DRB1_1106","DRB1_1107","DRB1_1108","DRB1_1109","DRB1_1110","DRB1_1111","DRB1_1112","DRB1_1113","DRB1_1114","DRB1_1115","DRB1_1116","DRB1_1117","DRB1_1118","DRB1_1119","DRB1_1120","DRB1_1121","DRB1_1124","DRB1_1125","DRB1_1127","DRB1_1128","DRB1_1129","DRB1_1130","DRB1_1131","DRB1_1132","DRB1_1133","DRB1_1134","DRB1_1135","DRB1_1136","DRB1_1137","DRB1_1138","DRB1_1139","DRB1_1141","DRB1_1142","DRB1_1143","DRB1_1144","DRB1_1145","DRB1_1146","DRB1_1147","DRB1_1148","DRB1_1149","DRB1_1150","DRB1_1151","DRB1_1152","DRB1_1153","DRB1_1154","DRB1_1155","DRB1_1156","DRB1_1157","DRB1_1158","DRB1_1159","DRB1_1160","DRB1_1161",
    "DRB1_1162","DRB1_1163","DRB1_1164","DRB1_1165","DRB1_1166","DRB1_1167","DRB1_1168","DRB1_1169","DRB1_1170","DRB1_1172","DRB1_1173","DRB1_1174","DRB1_1175","DRB1_1176","DRB1_1177","DRB1_1178","DRB1_1179","DRB1_1180","DRB1_1181","DRB1_1182","DRB1_1183","DRB1_1184","DRB1_1185","DRB1_1186","DRB1_1187","DRB1_1188","DRB1_1189","DRB1_1190","DRB1_1191","DRB1_1192","DRB1_1193","DRB1_1194","DRB1_1195","DRB1_1196","DRB1_1201","DRB1_1202","DRB1_1203","DRB1_1204","DRB1_1205","DRB1_1206","DRB1_1207","DRB1_1208","DRB1_1209","DRB1_1210","DRB1_1211","DRB1_1212","DRB1_1213","DRB1_1214","DRB1_1215","DRB1_1216","DRB1_1217","DRB1_1218","DRB1_1219","DRB1_1220","DRB1_1221","DRB1_1222","DRB1_1223","DRB1_1301","DRB1_1302","DRB1_1303","DRB1_1304","DRB1_1305","DRB1_1306","DRB1_1307",
    "DRB1_1308","DRB1_1309","DRB1_1310","DRB1_13100","DRB1_13101","DRB1_1311","DRB1_1312","DRB1_1313","DRB1_1314","DRB1_1315","DRB1_1316","DRB1_1317","DRB1_1318","DRB1_1319","DRB1_1320","DRB1_1321","DRB1_1322","DRB1_1323","DRB1_1324","DRB1_1326","DRB1_1327","DRB1_1329","DRB1_1330","DRB1_1331","DRB1_1332","DRB1_1333","DRB1_1334","DRB1_1335","DRB1_1336","DRB1_1337","DRB1_1338","DRB1_1339","DRB1_1341","DRB1_1342","DRB1_1343","DRB1_1344","DRB1_1346","DRB1_1347","DRB1_1348","DRB1_1349","DRB1_1350","DRB1_1351","DRB1_1352","DRB1_1353","DRB1_1354","DRB1_1355","DRB1_1356","DRB1_1357","DRB1_1358","DRB1_1359","DRB1_1360","DRB1_1361","DRB1_1362","DRB1_1363","DRB1_1364","DRB1_1365","DRB1_1366","DRB1_1367","DRB1_1368","DRB1_1369","DRB1_1370","DRB1_1371","DRB1_1372","DRB1_1373",
    "DRB1_1374","DRB1_1375","DRB1_1376","DRB1_1377","DRB1_1378","DRB1_1379","DRB1_1380","DRB1_1381","DRB1_1382","DRB1_1383","DRB1_1384","DRB1_1385","DRB1_1386","DRB1_1387","DRB1_1388","DRB1_1389","DRB1_1390","DRB1_1391","DRB1_1392","DRB1_1393","DRB1_1394","DRB1_1395","DRB1_1396","DRB1_1397","DRB1_1398","DRB1_1399","DRB1_1401","DRB1_1402","DRB1_1403","DRB1_1404","DRB1_1405","DRB1_1406","DRB1_1407","DRB1_1408","DRB1_1409","DRB1_1410","DRB1_1411","DRB1_1412","DRB1_1413","DRB1_1414","DRB1_1415","DRB1_1416","DRB1_1417","DRB1_1418","DRB1_1419","DRB1_1420","DRB1_1421","DRB1_1422","DRB1_1423","DRB1_1424","DRB1_1425","DRB1_1426","DRB1_1427","DRB1_1428","DRB1_1429","DRB1_1430","DRB1_1431","DRB1_1432","DRB1_1433","DRB1_1434","DRB1_1435","DRB1_1436","DRB1_1437","DRB1_1438",
    "DRB1_1439","DRB1_1440","DRB1_1441","DRB1_1442","DRB1_1443","DRB1_1444","DRB1_1445","DRB1_1446","DRB1_1447","DRB1_1448","DRB1_1449","DRB1_1450","DRB1_1451","DRB1_1452","DRB1_1453","DRB1_1454","DRB1_1455","DRB1_1456","DRB1_1457","DRB1_1458","DRB1_1459","DRB1_1460","DRB1_1461","DRB1_1462","DRB1_1463","DRB1_1464","DRB1_1465","DRB1_1467","DRB1_1468","DRB1_1469","DRB1_1470","DRB1_1471","DRB1_1472","DRB1_1473","DRB1_1474","DRB1_1475","DRB1_1476","DRB1_1477","DRB1_1478","DRB1_1479","DRB1_1480","DRB1_1481","DRB1_1482","DRB1_1483","DRB1_1484","DRB1_1485","DRB1_1486","DRB1_1487","DRB1_1488","DRB1_1489","DRB1_1490","DRB1_1491","DRB1_1493","DRB1_1494","DRB1_1495","DRB1_1496","DRB1_1497","DRB1_1498","DRB1_1499","DRB1_1501","DRB1_1502","DRB1_1503","DRB1_1504","DRB1_1505",
    "DRB1_1506","DRB1_1507","DRB1_1508","DRB1_1509","DRB1_1510","DRB1_1511","DRB1_1512","DRB1_1513","DRB1_1514","DRB1_1515","DRB1_1516","DRB1_1518","DRB1_1519","DRB1_1520","DRB1_1521","DRB1_1522","DRB1_1523","DRB1_1524","DRB1_1525","DRB1_1526","DRB1_1527","DRB1_1528","DRB1_1529","DRB1_1530","DRB1_1531","DRB1_1532","DRB1_1533","DRB1_1534","DRB1_1535","DRB1_1536","DRB1_1537","DRB1_1538","DRB1_1539","DRB1_1540","DRB1_1541","DRB1_1542","DRB1_1543","DRB1_1544","DRB1_1545","DRB1_1546","DRB1_1547","DRB1_1548","DRB1_1549","DRB1_1601","DRB1_1602","DRB1_1603","DRB1_1604","DRB1_1605","DRB1_1607","DRB1_1608","DRB1_1609","DRB1_1610","DRB1_1611","DRB1_1612","DRB1_1614","DRB1_1615","DRB1_1616"	
  ],
  "DRB3": [
    "DRB3_01_01","DRB3_01_04","DRB3_01_05","DRB3_01_08","DRB3_01_09","DRB3_01_11","DRB3_01_12","DRB3_01_13","DRB3_01_14","DRB3_02_01","DRB3_02_02","DRB3_02_04","DRB3_02_05","DRB3_02_09",
    "DRB3_02_10","DRB3_02_11","DRB3_02_12","DRB3_02_13","DRB3_02_14","DRB3_02_15","DRB3_02_16","DRB3_02_17","DRB3_02_18","DRB3_02_19","DRB3_02_20","DRB3_02_21","DRB3_02_22","DRB3_02_23",
    "DRB3_02_24","DRB3_02_25","DRB3_03_01","DRB3_03_03"
  ],
  "DRB4": ["DRB4_0101","DRB4_0103","DRB4_0104","DRB4_0106","DRB4_0107","DRB4_0108"],
  "DRB5": ["DRB5_0101","DRB5_0102","DRB5_0103","DRB5_0104","DRB5_0105","DRB5_0106","DRB5_0108N","DRB5_0111","DRB5_0112","DRB5_0113","DRB5_0114","DRB5_0202","DRB5_0203","DRB5_0204"],
  "Mouse": ["H_2_IAb", "H_2_IAd"]
};

// DP_alpha = ["DPA1_0103", "DPA1_0104", "DPA1_0105", "DPA1_0106", "DPA1_0107", "DPA1_0108", "DPA1_0109", "DPA1_0110","DPA1_0201", "DPA1_0202", "DPA1_0203", "DPA1_0204", "DPA1_0301", "DPA1_0302", "DPA1_0303", "DPA1_0401"]

// DP_beta = ["DPB1_0101", "DPB1_0201", "DPB1_0202", "DPB1_0301", "DPB1_0401", "DPB1_0402", "DPB1_0501", "DPB1_0601","DPB1_0801", "DPB1_0901", "DPB1_10001", "DPB1_1001", "DPB1_10101", "DPB1_10201", "DPB1_10301", "DPB1_10401","DPB1_10501", "DPB1_10601", "DPB1_10701", "DPB1_10801", "DPB1_10901", "DPB1_11001", "DPB1_1101", "DPB1_11101","DPB1_11201", "DPB1_11301", "DPB1_11401", "DPB1_11501"]

// DQ_alpha = ["DQA1_0101", "DQA1_0102", "DQA1_0103", "DQA1_0104", "DQA1_0105", "DQA1_0106", "DQA1_0107", "DQA1_0108","DQA1_0109", "DQA1_0201", "DQA1_0301", "DQA1_0302", "DQA1_0303", "DQA1_0401", "DQA1_0402", "DQA1_0404","DQA1_0501", "DQA1_0503", "DQA1_0504", "DQA1_0505", "DQA1_0506", "DQA1_0507", "DQA1_0508", "DQA1_0509","DQA1_0510", "DQA1_0511", "DQA1_0601", "DQA1_0602"]

// DQ_beta = [
//   "DQB1_0201", "DQB1_0202", "DQB1_0203", "DQB1_0204", "DQB1_0205", "DQB1_0206", "DQB1_0301", "DQB1_0302",
//   "DQB1_0303", "DQB1_0304", "DQB1_0305", "DQB1_0306", "DQB1_0307", "DQB1_0308", "DQB1_0309", "DQB1_0310",
//   "DQB1_0311", "DQB1_0312", "DQB1_0313", "DQB1_0314", "DQB1_0315", "DQB1_0316", "DQB1_0317", "DQB1_0318",
//   "DQB1_0319", "DQB1_0320", "DQB1_0321", "DQB1_0322"
// ]

// ------------------------------------End MHC-II Alleles------------------------------------|
// Get elements
const mhcIDropdown = document.getElementById("netmhci-allele");
const mhcIAlleleDropdown = document.getElementById("netmhci-allele-specific");
const selectedMhcIAllelesInput = document.getElementById("selected-alleles-i");

const mhcIIDropdown = document.getElementById("netmhcii-allele");
const mhcIIAlleleDropdown = document.getElementById("netmhcii-allele-specific");
const selectedMhcIIAllelesInput = document.getElementById("selected-alleles-ii");

let mhcIAlleles = [];
let mhcIIAlleles = [];

// Utility: Populate a dropdown with options
function populateDropdown(dropdown, options) {
  dropdown.innerHTML = "";
  options.forEach(optionValue => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    dropdown.appendChild(option);
  });
}

// Populate supertypes in a parent dropdown
function initParentDropdown(dropdown, alleleMap) {
  populateDropdown(dropdown, Object.keys(alleleMap));
}

// Handle changes in supertype selection
function handleSupertypeChange(parentDropdown, childDropdown, alleleMap) {
  parentDropdown.addEventListener("change", () => {
    const selectedSupertype = parentDropdown.value;
    updateSpecificAlleles(selectedSupertype, childDropdown, alleleMap);
  });
}

// Update nested dropdown based on selected supertype
function updateSpecificAlleles(selectedSupertype, specificDropdown, alleleMap) {
  const alleles = alleleMap[selectedSupertype] || [];
  populateDropdown(specificDropdown, alleles);
}

// Handle nested allele selection with toggle functionality
function handleAlleleSelection(dropdown, selectedAlleles, inputField, maxCount = 20) {
  dropdown.addEventListener("change", () => {
    const selected = dropdown.value;
    const index = selectedAlleles.indexOf(selected);
    if (index !== -1) {
      // Deselect allele by mutating the array in-place
      selectedAlleles.splice(index, 1);
    } else {
      if (selectedAlleles.length < maxCount) {
        selectedAlleles.push(selected);
      } else {
        console.log('selected value present but not identified', selectedAlleles, selected);
        alert(`Maximum of ${maxCount} alleles can be selected.`);
      }
    }

    // Update the input field
    inputField.value = selectedAlleles.join(", ");
  });
}

// Initialization
function initAlleleSelectionSystem(parentDropdown, childDropdown, inputField, alleleMap, selectedAlleles) {
  initParentDropdown(parentDropdown, alleleMap);
  handleSupertypeChange(parentDropdown, childDropdown, alleleMap);
  handleAlleleSelection(childDropdown, selectedAlleles, inputField);
  // Initial population
  const initialValue = parentDropdown.value || parentDropdown.options[0].value;
  updateSpecificAlleles(initialValue, childDropdown, alleleMap);
}

// Initialize both MHC I and II systems
initAlleleSelectionSystem(mhcIDropdown, mhcIAlleleDropdown, selectedMhcIAllelesInput, alleleIMap, mhcIAlleles);
initAlleleSelectionSystem(mhcIIDropdown, mhcIIAlleleDropdown, selectedMhcIIAllelesInput, alleleIIMap, mhcIIAlleles);



/**
 * Set up range input value displays
 */
function setupRangeInputs() {
  const rangeInputs = document.querySelectorAll('input[type="range"]');
   
  rangeInputs.forEach(input => {
    const valueDisplay = document.getElementById(`${input.id}-value`);
    if (valueDisplay) {
      // Update display on input change
      input.addEventListener('input', function() {
        valueDisplay.textContent = this.value;
      });
      
      // Set initial value
      valueDisplay.textContent = input.value;
    }
  });
}

/**
 * Show loading state for a step
 * @param {string} loadingId - The ID of the loading element to show
 */
function showLoading(loadingId) {
  document.getElementById(loadingId).style.display = 'block';
}

/**
 * Hide loading state for a step
 * @param {string} loadingId - The ID of the loading element to hide
 */
function hideLoading(loadingId) {
  document.getElementById(loadingId).style.display = 'none';
}

/**
 * Show results for a step
 * @param {string} resultsId - The ID of the results element to show
 */
function showResults(resultsId) {
  document.getElementById(resultsId).style.display = 'block';
}

/**
 * Show error state for a step
 * @param {string} errorId - The ID of the error element to show
 * @param {string} message - The error message to display
 */
function showError(errorId, message) {
  const errorElement = document.getElementById(errorId);
  const messageElement = errorElement.querySelector('p');
  
  if (messageElement) {
    messageElement.textContent = message;
  }
  
  errorElement.style.display = 'block';
}

/**
 * Hide error state for a step
 * @param {string} errorId - The ID of the error element to hide
 */
function hideError(errorId) {
  document.getElementById(errorId).style.display = 'none';
}

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - The minimum value
 * @param {number} max - The maximum value
 * @returns {number} A random number between min and max
 */
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Populate the epitope table with mock data
 */
function populateMockEpitopeTable() {
  const table = document.getElementById('epitopeTable');
  const tbody = table.querySelector('tbody');
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Generate mock data
  const epitopeTypes = ['B-Cell', 'T-Cell', 'MHC-I', 'MHC-II'];
  const sequencePrefix = 'Seq';
  
  for (let i = 1; i <= 5; i++) {
    const row = document.createElement('tr');
    
    const typeIndex = Math.floor(Math.random() * epitopeTypes.length);
    const sequence = generateRandomAminoAcidSequence(9);
    const position = getRandomNumber(1, 300);
    const score = (Math.random() * 0.5 + 0.5).toFixed(2);
    
    row.innerHTML = `
      <td>${sequencePrefix}${getRandomNumber(1, 10)}</td>
      <td>${epitopeTypes[typeIndex]}</td>
      <td>${sequence}</td>
      <td>${position}-${position + sequence.length - 1}</td>
      <td>${score}</td>
    `;
    
    tbody.appendChild(row);
  }
}

/**
 * Populate the viable epitope table with mock data
 */
function populateMockViableEpitopeTable() {
  const table = document.getElementById('viableEpitopeTable');
  const tbody = table.querySelector('tbody');
  
  // Clear existing rows
  tbody.innerHTML = '';
  
  // Generate mock data
  const epitopeTypes = ['B-Cell', 'T-Cell', 'MHC-I', 'MHC-II'];
  
  for (let i = 1; i <= 5; i++) {
    const row = document.createElement('tr');
    
    const typeIndex = Math.floor(Math.random() * epitopeTypes.length);
    const sequence = generateRandomAminoAcidSequence(9);
    const allergenScore = (Math.random() * 0.3).toFixed(2);
    const antigenScore = (Math.random() * 0.5 + 0.5).toFixed(2);
    const toxinScore = (Math.random() * 0.3).toFixed(2);
    
    row.innerHTML = `
      <td>EP${getRandomNumber(100, 999)}</td>
      <td>${sequence}</td>
      <td>${epitopeTypes[typeIndex]}</td>
      <td>${allergenScore}</td>
      <td>${antigenScore}</td>
      <td>${toxinScore}</td>
    `;
    
    tbody.appendChild(row);
  }
}

/**
 * Generate a random amino acid sequence of the specified length
 * @param {number} length - The length of the sequence to generate
 * @returns {string} A random amino acid sequence
 */
function generateRandomAminoAcidSequence(length) {
  const aminoAcids = ['A', 'R', 'N', 'D', 'C', 'E', 'Q', 'G', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
  let sequence = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * aminoAcids.length);
    sequence += aminoAcids[randomIndex];
  }
  
  return sequence;
}

function step1Upload(){
  const fileInput = document.getElementById('fasta-upload'); // Your file input element
  console.log(fileInput.files)
  const file = fileInput.files[0];
  const formData = new FormData();
  formData.append('file', file);
  
  fetch('/step1', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) throw new Error('Upload failed');
    return response.json();
  })
  .then(data => {
    console.log('Upload successful:', data);
    // You can handle returned data if needed
  })
  .catch(error => {
    console.error('Upload error:', error);
    alert('Error uploading file');
  });
  console.log("Send the uploaded file")
}

function collectStep2DataAndSend() {
  // (same as before: gather all settings)
  const start = document.getElementById('startSequence').value;
  const end = document.getElementById('endSequence').value;

  // AlgPred settings
  const algpredThreshold = document.getElementById('algpred-threshold').value;
  const algpredMethod = document.getElementById('algpred-method').value;

  // VaxiJen settings
  const vaxijenThreshold = document.getElementById('vaxijen-threshold').value;
  const vaxijenTarget = document.getElementById('vaxijen-target').value;

  // Phobius settings
  const phobiusMethod = document.getElementById('phobius-method').value;
  const phobiusFormat = document.getElementById('phobius-format').value;
  
  const data = {
    sequence_range: {
      start: parseInt(start),
      end: parseInt(end)
    },
    algpred: {
      threshold: parseFloat(algpredThreshold),
      method: algpredMethod
    },
    vaxijen: {
      threshold: parseFloat(vaxijenThreshold),
      target: vaxijenTarget
    },
    phobius: {
      method: phobiusMethod,
      format: phobiusFormat
    }
  };

  // Start loading UI
  showLoading('loadingStep2');

  // Send task to backend
  fetch('/step2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    const taskId = result.task_id;
    console.log('Task 2 submitted with ID:', taskId);
    
    // Start polling every minute
    const pollInterval = setInterval(() => {
      fetch(`/task_status/${taskId}/step2`)
        .then(res => res.json())
        .then(statusResult => {
          console.log('Polling result:', statusResult);
          if (statusResult.status === 'success') {
            clearInterval(pollInterval);
            hideLoading('loadingStep2');
            showResults('step2Results');
            console.log('Task result:', statusResult.result);

            // Update results here with real data
            document.getElementById('algpredPassCount').textContent = statusResult.result.allergen_count;
            document.getElementById('vaxijenPassCount').textContent = statusResult.result.antigen_count;
            document.getElementById('phobiusPassCount').textContent = statusResult.result.signalp_count;
            document.getElementById('totalPassCount').textContent = statusResult.result.total_count;
            
            document.querySelector('.step[data-step="2"]').classList.add('complete');
          } else if (statusResult.status === 'failure') {
            clearInterval(pollInterval);
            hideLoading('loadingStep2');
            showError('errorStep2', 'Error: ' + statusResult.error);
          } else {
            console.log('Waiting for task to complete...');
          }
        });
    }, 10000); // 1 minute
  })
  .catch(error => {
    hideLoading('loadingStep2');
    showError('errorStep2', 'Error: ' + error.message);
  });
}

function collectStep3DataAndSend() {
  // ABCPred settings
  const abcPredThreshold = document.getElementById('abcpred-threshold').value;
  const algpredPeptideLength = document.getElementById('abcpred-length').value;

  // NetCTL settings
  const netctlSupertype = document.getElementById('netctl-supertype').value;
  const netctlThreshold = document.getElementById('netctl-threshold').value;
  const netctlTap = document.getElementById('netctl-tap-efficiency').value;
  const netctlCTerminal = document.getElementById('netctl-c-terminal').value;

  // NetMHCI settings
  const netmhciSelectedAlleles = document.getElementById('selected-alleles-i').value;
  const netmhciPeptideLength = document.getElementById('netmhci-length').value;
  const netmhciStrongThreshold = document.getElementById('netmhci-strong-threshold').value;
  const netmhciWeakThreshold = document.getElementById('netmhci-weak-threshold').value;
  
  // NetMHCII settings
  const netmhciiSelectedAlleles = document.getElementById('selected-alleles-ii').value;
  const netmhciiPeptideLength = document.getElementById('netmhcii-length').value;
  const netmhciiStrongThreshold = document.getElementById('netmhcii-strong-threshold').value;
  const netmhciiWeakThreshold = document.getElementById('netmhcii-weak-threshold').value;
  
  const data = {
    abcpred: {
      threshold: parseFloat(abcPredThreshold),
      length: parseInt(algpredPeptideLength)
    },
    netctl: {
      threshold: parseFloat(netctlThreshold),
      tapEfficiency: parseFloat(netctlTap),
      cTerminal: parseFloat(netctlCTerminal),
      supertype: netctlSupertype
    },
    netmhci: {
      strongThreshold: parseFloat(netmhciStrongThreshold),
      weakThreshold: parseFloat(netmhciWeakThreshold),
      length: parseInt(netmhciPeptideLength),
      alleles: netmhciSelectedAlleles
    },
    netmhcii: {
      strongThreshold: parseFloat(netmhciiStrongThreshold),
      weakThreshold: parseFloat(netmhciiWeakThreshold),
      length: parseInt(netmhciiPeptideLength),
      alleles: netmhciiSelectedAlleles
    }
  };

  // Start loading UI
  showLoading('loadingStep3');

  // Send task to backend
  fetch('/step3', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    const taskId = result.task_id;
    console.log('Task 3 submitted with ID:', taskId);
    
    // Start polling every minute
    const pollInterval = setInterval(() => {
      fetch(`/task_status/${taskId}/step3`)
        .then(res => res.json())
        .then(statusResult => {
          console.log('Polling result:', statusResult);
          if (statusResult.status === 'success') {
            clearInterval(pollInterval);
            hideLoading('loadingStep3');
            showResults('step3Results');
            populateMockEpitopeTable();
            console.log('Task result:', statusResult.result);

            // Update results here with real data
            document.getElementById('bcellCount').textContent = statusResult.result[0];
            document.getElementById('tcellCount').textContent = statusResult.result[1];
            document.getElementById('mhc1Count').textContent = statusResult.result[2];
            document.getElementById('mhc2Count').textContent = statusResult.result[3];
            
            document.querySelector('.step[data-step="3"]').classList.add('complete');
          } else if (statusResult.status === 'failure') {
            clearInterval(pollInterval);
            hideLoading('loadingStep3');
            showError('errorStep3', 'Error: ' + statusResult.error);
          } else {
            console.log('Waiting for task to complete...');
          }
        });
    }, 10000); // 1 minute
  })
  .catch(error => {
    hideLoading('loadingStep2');
    showError('errorStep2', 'Error: ' + error.message);
  });
}

const count={
  'bcell': 0,
  'netctl': 0,
  'netmhci': 0,
  'netmhcii':0
}

function collectStep4DataAndSend() {
  // AlgPred settings
  const algpredThreshold = document.getElementById('algpred-threshold-ii').value;
  const algpredMethod = document.getElementById('algpred-method').value;

  // VaxiJen settings
  const vaxijenThreshold = document.getElementById('vaxijen-threshold-ii').value;
  const vaxijenTarget = document.getElementById('vaxijen-target').value;

  // ToxinPred settings
  const toxinpredMethod = document.getElementById('toxinpred-method').value;
  const toxinpredCutoff = document.getElementById('toxinpred-cutoff').value;
  const toxinpredThreshold = document.getElementById('toxinpred-threshold').value;
  
  const data = {
    algpred: {
      threshold: parseFloat(algpredThreshold),
      method: algpredMethod
    },
    vaxijen: {
      threshold: parseFloat(vaxijenThreshold),
      target: vaxijenTarget
    },
    toxinpred: {
      method: toxinpredMethod,
      cutoff: toxinpredCutoff,
      threshold: toxinpredThreshold
    }
  };

  // Start loading UI
  showLoading('loadingStep4');

  // Send task to backend
  fetch('/step4', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    const taskId = result.task_id;
    console.log('Task 4 submitted with ID:', taskId);
    
    // Start polling every minute
    const pollInterval = setInterval(() => {
      fetch(`/task_status/${taskId}/step4`)
        .then(res => res.json())
        .then(statusResult => {
          console.log('Polling result:', statusResult);
          if (statusResult.status === 'success') {
            clearInterval(pollInterval);
            hideLoading('loadingStep4');
            showResults('step4Results');
            // populateMockViableEpitopeTable();
            console.log('Task result:', statusResult.result);

            // Update results here with real data
            document.getElementById('bCellAlgpredPassCount').textContent = statusResult.result.bcell.allergen_count;
            document.getElementById('bCellVaxijenPassCount').textContent = statusResult.result.bcell.antigen_count;
            document.getElementById('bCellToxinpredPassCount').textContent = statusResult.result.bcell.toxicity_count;
            document.getElementById('bCellTotalPassCount').textContent = statusResult.result.bcell.total_count;

            document.getElementById('netctlAlgpredPassCount').textContent = statusResult.result.netctl.allergen_count;
            document.getElementById('netctlVaxijenPassCount').textContent = statusResult.result.netctl.antigen_count;
            document.getElementById('netctlToxinpredPassCount').textContent = statusResult.result.netctl.toxicity_count;
            document.getElementById('netctlTotalPassCount').textContent = statusResult.result.netctl.total_count;

            document.getElementById('netmhciAlgpredPassCount').textContent = statusResult.result.netmhci.allergen_count;
            document.getElementById('netmhciVaxijenPassCount').textContent = statusResult.result.netmhci.antigen_count;
            document.getElementById('netmhciToxinpredPassCount').textContent = statusResult.result.netmhci.toxicity_count;
            document.getElementById('netmhciTotalPassCount').textContent = statusResult.result.netmhci.total_count;

            document.getElementById('netmhciiAlgpredPassCount').textContent = statusResult.result.netmhcii.allergen_count;
            document.getElementById('netmhciiVaxijenPassCount').textContent = statusResult.result.netmhcii.antigen_count;
            document.getElementById('netmhciiToxinpredPassCount').textContent = statusResult.result.netmhcii.toxicity_count;
            document.getElementById('netmhciiTotalPassCount').textContent = statusResult.result.netmhcii.total_count;
            count['bcell']=statusResult.result.bcell.total_count
            count['netctl']=statusResult.result.netctl.total_count
            count['netmhci']=statusResult.result.netmhci.total_count
            count['netmhcii']=statusResult.result.netmhcii.total_count
            
            document.querySelector('.step[data-step="4"]').classList.add('complete');
          } else if (statusResult.status === 'failure') {
            clearInterval(pollInterval);
            hideLoading('loadingStep4');
            showError('errorStep4', 'Error: ' + statusResult.error);
          } else {
            console.log('Waiting for task to complete...');
          }
        });
    }, 10000); // 1 minute
  })
  .catch(error => {
    hideLoading('loadingStep4');
    showError('errorStep4', 'Error: ' + error.message);
  });
}

function createEpitopeChart() {
  // In a real application, this would use a charting library like Chart.js
  // For this demo, we'll create a placeholder for the chart
  const chartContainer = document.querySelector('.chart-container');
  
  if (chartContainer) {
    // Create a sample chart visualization
    chartContainer.innerHTML = `
      <div class="mock-chart">
        <div class="chart-title">Epitope Distribution by Type</div>
        <div class="chart-bars">
          <div class="chart-bar" style="height: ${count['bcell']}px;" data-type="B-Cell"></div>
          <div class="chart-bar" style="height: ${count['netctl']}px;" data-type="T-Cell"></div>
          <div class="chart-bar" style="height: ${count['netmhci']}px;" data-type="MHC-I"></div>
          <div class="chart-bar" style="height: ${count['netmhcii']}px;" data-type="MHC-II"></div>
        </div>
        <div class="chart-labels">
          <div class="chart-label">B-Cell</div>
          <div class="chart-label">T-Cell</div>
          <div class="chart-label">MHC-I</div>
          <div class="chart-label">MHC-II</div>
        </div>
      </div>
    `;
    
    // Add styles for the mock chart
    const style = document.createElement('style');
    style.textContent = `
      .mock-chart {
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .chart-title {
        font-weight: bold;
        margin-bottom: 20px;
        color: var(--primary-color);
      }
      
      .chart-bars {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 200px;
        width: 100%;
        margin-bottom: 10px;
      }
      
      .chart-bar {
        width: 60px;
        background-color: var(--secondary-color);
        border-radius: 4px 4px 0 0;
        position: relative;
        transition: height 1s ease-out;
      }
      
      .chart-bar[data-type="B-Cell"] {
        background-color: var(--primary-color);
      }
      
      .chart-bar[data-type="T-Cell"] {
        background-color: var(--secondary-color);
      }
      
      .chart-bar[data-type="MHC-I"] {
        background-color: var(--accent-color);
      }
      
      .chart-bar[data-type="MHC-II"] {
        background-color: var(--gray-500);
      }
      
      .chart-labels {
        display: flex;
        justify-content: space-around;
        width: 100%;
      }
      
      .chart-label {
        width: 60px;
        text-align: center;
        font-size: 12px;
        color: var(--gray-700);
      }
    `;
    
    document.head.appendChild(style);
    
    // Add animation effect
    setTimeout(() => {
      const bars = document.querySelectorAll('.chart-bar');
      bars.forEach(bar => {
        const originalHeight = bar.style.height;
        bar.style.height = '0';
        setTimeout(() => {
          bar.style.height = originalHeight;
        }, 100);
      });
    }, 100);
  }
}

const backButton = document.getElementById('backToHome');
backButton.addEventListener('click', function() {
  window.location.href = '/';  
});