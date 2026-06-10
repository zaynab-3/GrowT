const https = require('https');
const fs = require('fs');
const path = require('path');

const screens = [
  {
    id: "1caf5679f1ee45c4a5e89c167d757142",
    title: "Folders List",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLu3unJUMIehT3GAwCEeLeqhF8Xkkg9WoPW2AFaJi02tMUL3LO-lI_BFMEt9XzCBY8BIlLv98kxvbip6vOC-MOUKu245eIv69nCnbHH1Th65VlUk1BJMVLu9E7Q-u7YIdlhGHCAFbChUa5FekPL68Q5rGk-nIRlfqvoWZstbWVNsHfcLJuvGmeoO2oI84rkV0U82Qatzrs77Psjk1AsS9gfiH568Pr_246zRDrgEAWc-t1xR90wUSLJorX01",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2E3ZTQ3NzQwMjNiYzBkYjQ0MmUwY2VkEgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "38f76182f0d54f7f956831de6ce8b6ec",
    title: "Dashboard",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsvwWXrmStG9zk3WMJX7o3XRr4KU31Tm7m_DQyGZ24xGywZRz9QyA80ISyQU0Tf0Shwb93DCyZXbYsG0ib7uGwtG14T8V5JMJkCZK7ajMRi5jRavERYpzCBFtEQJs9V9HwY3eZlaJbHDU2VXoWXgcgXO-UjZFbXObs1qIHGIGjzlioMDtLByuSMLVyNiDlE4bqneFbWRgcMJPJXZ7x4exg63y_Dmj8UBIpQimwqPOyv-sizUIW72lcAP773",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2E5OGFiZDgwOGE2MTRiYjgzMjNlNmJmEgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "5b418666d8a84f2298efa5c76cd42ef4",
    title: "Folders List (Enhanced)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLtMFicVX49YnbPb38_V4eBnCLwpbFlcAkUiNb9ff3J7rADBSbS-Py9rRq99z5FCiUqGZUxHLMJjM5PIxme2px0_eLAdEkv8xv6DLPU73yG_Qvjz_lsCdLem6vtwjYMD96Ivqfq-XMYfwT_LRttRqHQs_w66yONrRV3AwWc8k4nyUrA8j9f2bvdkL88cCsntANyA872V1Mz8US_CMTIiKOfdTtdbo9r7A0LDqKJFU0t8bWWVeocwtFxVWQrg",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2FiMDhkZDkwNDVhZDdiOThmMmE2OWI0EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "6d97bdc4c014438bace63bdf55923400",
    title: "Folder Detail (Workspace)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsp6H_dGvbkk1nscf026ncpzhfXSBdrqZcmr92Y-DLmaauwgRYTYxHGdoECcJ5sVTT4VwP_Y_wJ8JQhIMUuCeHpbXW510FQy6yqtI3SJyVshvIr7EQW_pCsnY2RZmDV_h2JpLbFMbAfGRWiondmLExHx5uumJMz2MmqYdD8dVX-ZTKeI6jzrvAPxTDnSzYNC4tLtejnZmwRhu8tDr9gQXYQ4CkheKyjSnWKtfmYHzUytl8VU6epKbEHzE8",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2FjOGQxYzMwMjNiZTVkNmU5MDNkM2Q2EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "7afce295352447cb9ef3c261ff750197",
    title: "Create/Edit Form",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLtl08YFU6WGJs49hZk23xifOyyE7wBxM-rbdc49majpb5htvAxhsuQLFHMsyhS7tyF7nZjYY06Y7R4_oz80gyvn0iMBQDACl60D7lQ9Vx_dpbA7gpLMA5fWNKNZ0dfSAJa_ub7DmrRrivjPHCuHCSBOculxQUphYliamoUe4_-L5S6QfbbijWJBHBHqKyP6aHVZ_ZB2L4_U2R83NaniBp2AR63IYLcyiuz4isJDZq5j9RryHt8dHeMUebg",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2EyYWUzN2EwNDRmNTRkNzVmMWRjZTE1EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "7cc2c5bf9f2d4164a9c71d23b9292ef8",
    title: "Tasks List (Enhanced)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsxVrtPU_gO3Ig9RiSOQ_AGD0MNOTYcCHPfhWG_E8Uo-ZR70ta7rMNFrbrIHc5OQMWVEHueU7Qh6mHH275dbwoNeC9vI-eB-e7aw0L8L1BXDHP9VYJb8JYBMbnoAZAXMIR4gd5kddJyfC4cV3RHjhSlq_jqx-4IFE6nSYm9QeJj-Z6kAwRM-3dqMOU4fRMAjvEVFYmGERY87fGAAwKwxaPikgR9LM0BYCBEtxfvMhMD68RRqzZTK9CrJh5S",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2E2MDIwYzgwNDRmNTRkNzVmMWRjZTE1EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "850308f639654afc88e8ce23326f2866",
    title: "Profile & Settings (Refined)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsFL6b1VezhD0Zxf7YFXoe044l42qmL35zFhNPGjYzZSr0j2BrwiXZIfw4zwWdWR5cuRVgCSIBJegzHH9SxoDl67tX8EuS6_VQFH9tL-2Pf3fBFgnnXNpNNIEQpoC0v5-7b_tgC1f4ryyCJTJ-lSANZwFZJefFmNi9ZVvOrWg6GnnBKgpadnCDHYcNN3LV6ru3eBjOheii8m4vP8bZjZ-aBqj2vI0yZPtMhuMyXt-MvRbTwXNF2UiXNzGI",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2E0NzE3ZmQwNDRmNmJhNzAzMDdlNWI5EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "85e898cf8b824ac7a258f9f6858ecf93",
    title: "Profile & Settings (Mobile)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsJ19RZx1TxgmRo8K4EMZxusn32QL3WfIoeDCD4djLywswkTn42obvRjF5M-71ULhzECbo5CF2ktR2dqOyM7xlMLK9_kUwkNFW3guv6Q-xKlqjbH2sFM0ejxKOl9AHrw_ijfq_GLCUGV-U9AV3aNlTwx7XSMM9dRhskKkJ42x6ipq02BigMuoKEs2sw8OZwp7QY49v5R6r_CF-Nv3pgZZSD_7etbWizoDhJGLl6lQcqUWyH912Wg6quR0o",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBjMjYzMDQxNGUxNTQ0ZjNiM2M0OTBlY2YzZmYxYjhjEgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "a2bb8621e6214b10b2e44428303e82d2",
    title: "Acquaintances & Connections",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLtIzmTi830yu2apfGWaXfrHIUmzcuAhUvD2lu5oDrn_dZooI0SR_BmTHyLnK2kgkDJ2RgPU5zZcR8dfCntXImVN-Fkzi4SSG-ddpjhUfGdoq8A26-pEKCkrDlrh2TpEYxfOJD42WKliQwOtaYpj_l5tliypWainj-GwO-ZdRlWdQIlO4QMeS6FIqxnpKeXBH4g_5vM5ZO7P0bh3xMKysz0gIkXV0JxLKtOtIhVyNiYqcY7r69uvPMFpwewv",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2EwYWQxMTIwMjNiZjYyMTg2MzIxMjA5EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "11462736039259046608",
    title: "DESIGN.md",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBKOARIhYXBwX2NvbXBhbmlvbl91c2VyX3VwbG9hZGVkX2ZpbGVzGmkKM3VzZXJfdXBsb2FkZWRfaHRtbF8wMDA2NTNhNWQxZjRhYTVhMDIzYmUxN2M2OTMwMzYzYhILEgcQ68_UupYTGAGSASQKCnByb2plY3RfaWQSFkIUMTIyODA3MTAyMjkxMzc1ODYzNjA&filename=&opi=89354086"
  },
  {
    id: "c1f425af61d34ea8beb34ab87ea65066",
    title: "Tasks List",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLs3vHXS97CFkSg7RjcKluXDs92Ff6_kESb-HFSCYNtuRkhhbrw6VC7C38iNyYQN8knSejTQ5QOQ6Ub2-kW_DoIub-wQP9TIyK_9xx0S-kdphyqSQA0J9FO7mi8cwATVBMf7N1NtXa51yTpYdFnOaJMMnwyrk3Y6hKYyt8Y9PiOri8gpuZEwqp8byhRc_rZFXb8q_tLhsgXxEbNgIggo-4E6xaDHwDLSesKA3LaVM3HWLPAOMCkpEIFM8OEA",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1M2E3M2FlMmI0NzUwMjI3YmQxZDE4MTY3MTYwEgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "dd8599c88bb34f31a7d7e49e27156695",
    title: "Profile & Settings (Corrected)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsZUHxALHpj9JQ4P6UsOL5MOUqiyPcCDvtORuOGUxJKw5RrU7LiAzGrmBRX1XWL2aK7BkR8uOuYdePeTnXMdvN8qMFV1cTi_TT4tUjErcCb95v2EhAWlCLpeMNhMssi5kbN1RrcUDCT5nSxY-h_NRWMnNHp3AipgNzAmJomBg8Xtcds6vURlyYv-zD5d7F-WthpMkGVjzf8pGqAx23CL2qSzqdtEPCjtfQEpHjna_7gFdyrgc0qrWDXlZ_m",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2Q5YmQ3ODgzNmI4MjRhYTNiZGZjOTNlYTA3NjUwOWQ4EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "e0f5569672a549b793be7ad45c2a14da",
    title: "Profile & Settings",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLsZudhfD7VceLxR3Kw0I6AHJyEI8KATzAaLMpWA3bHCP3l6RBaeBjBZzDKsZIZ32c_LrmADMph-JQPDTejAbpOnh9moBQ4-WYPwMhedEBHI5pl53ecYgHnYokWni6-Ejab0LntUvW1Hy36xM3nbldvnfcXhHrhr0S7OZ01MWg8dnljV7eHLQaI90v4SdmNV6y9iL5uTnLayg1cmQyyVDxR-w2hlXxfqPbc0dzUlwiRgqdyH-RGhbQY8fkJM",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2NiMDNmMzBlYmRhNTQzZWQ4MzlmMzVmNzljZjlkNmQ5EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  },
  {
    id: "61d0fa223f7440879dafd40b92c4b14a",
    title: "Profile & Settings (Mobile Corrected)",
    img: "https://lh3.googleusercontent.com/aida/AP1WRLtWdXUDd9oE-ZPqnWdCK0WeMp5f0jCNHjM_H9qzr8r3fT3N7Y8Jh5AP1-e0c7OGRcL1l4_m0UxBWVPRqdCs9hRXPuAR7lS-jChyAYwRNneAttGOUtAc2AVf-q9CUjZHK5RAgkK2V6USNNaj0aKoQyPe5NYNwOaOdEbpJJ06Uc-sX9KwcB7vtaAKJAdofknM2W2jiWlh86QMVxgo4_jIGlSSVJbLvTtlrARnOpZ200naWDRALYjjVUeD2z4",
    html: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2U0NjI3MGZhNDljMjQ2ZmI4ODU4NDE5ZmJlMDc5Yzg4EgsSBxDrz9S6lhMYAZIBJAoKcHJvamVjdF9pZBIWQhQxMjI4MDcxMDIyOTEzNzU4NjM2MA&filename=&opi=89354086"
  }
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    if (!url) {
      resolve();
      return;
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  let indexMd = '# STITCH ASSET INDEX\n\n| Name | ID | Local Image | Local Code |\n|---|---|---|---|\n';
  
  for (const s of screens) {
    const extCode = s.id === "11462736039259046608" ? ".md" : ".html";
    const codePath = `docs/stitch/code/${s.id}${extCode}`;
    const imgPath = s.img ? `docs/stitch/screens/${s.id}.png` : '';
    
    console.log(`Downloading ${s.title}...`);
    try {
      if (s.html) await download(s.html, codePath);
      if (s.img) await download(s.img, imgPath);
      indexMd += `| ${s.title} | ${s.id} | ${imgPath || 'N/A'} | ${codePath} |\n`;
    } catch (e) {
      console.error(`Failed to download ${s.title}: ${e.message}`);
    }
  }
  
  indexMd += `| Design System | asset-stub-assets_57e6014aaec14d4a8ae57599953772af | FAILED (Invalid ID for Stitch API) | FAILED (Invalid ID for Stitch API) |\n`;
  indexMd += `| Design System | asset-stub-assets_807da4f8cb034a5d9c8d5fa00cb0435f | FAILED (Invalid ID for Stitch API) | FAILED (Invalid ID for Stitch API) |\n`;

  fs.writeFileSync('docs/stitch/STITCH_ASSET_INDEX.md', indexMd);
  console.log('Done!');
}

run();
