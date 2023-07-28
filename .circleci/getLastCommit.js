const slugPrefix = "gh/mojaloop/";
//const ciUsername = "mojaloopci";
let debug = false;
let user;// = "0d7c20153dcb2e4805b49d4a207eafed923dd53b";
let branch;
let projectslug;
let headers;

let pipelinesNextPageToken = null;

// credit->https://stackoverflow.com/a/54098693
function getArgs() {
    const args = {};
    process.argv.slice(2, process.argv.length).forEach(arg => {
        // long arg
        if (arg.slice(0, 2)==="--") {
            const longArg = arg.split("=");
            const longArgFlag = longArg[0].slice(2, longArg[0].length);
            const longArgValue = longArg.length > 1 ? longArg[1]:true;
            args[longArgFlag] = longArgValue;
        }
        // flags
        else if (arg[0]==="-") {
            const flags = arg.slice(1, arg.length).split("");
            flags.forEach(flag => {
                args[flag] = true;
            });
        }
    });
    return args;
}

function processArgs() {
    const args = getArgs();
    if(args.hasOwnProperty("debug")) debug = true; // avoid overriding the code var above when debugging

    if(debug)
        console.log(args);

    if(!args.user || typeof args.user !== "string" || !args.user.length>1){
        console.error("Invalid user arg provided - should be '--user=userToken'");
        process.exit(1);
    }
    if (!args.repo || typeof args.repo !== "string" || !args.repo.length > 1) {
        console.error("Invalid repo arg provided - should be '--repo=repositoryName'");
        process.exit(1);
    }
    if(!args.branch || typeof args.branch !== "string" || !args.branch.length>1){
        console.error("Invalid branch arg provided - should be '--branch=branchName'");
        process.exit(1);
    }

    user = args.user;
    branch = args.branch;
    projectslug = slugPrefix + args.repo;

    headers = new Headers({
        "Authorization": `Basic ${Buffer.from(`${user}:`).toString("base64")}`,
        "Content-Type": "application/json"
    });
}

async function getData(url){
    try{
        const resp = await fetch(url, {headers: headers});
        return await resp.json();
    }catch (e){
        console.error(e);
        throw e;
    }
}

async function getPipelines() {
    let url = `https://circleci.com/api/v2/project/${projectslug}/pipeline/`;
    if(pipelinesNextPageToken)
        url += `?page-token=${pipelinesNextPageToken}`;

    const pipelinesResp = await getData(url);

    if (!pipelinesResp || !pipelinesResp.items) {
        throw new Error("Invalid or empty response from getPipelines()");
    }

    // if no next_page_token came, it's because it is the last page
    pipelinesNextPageToken = pipelinesResp.next_page_token;

    if (pipelinesResp.items.length <= 0) {
        return [];
    }

    return pipelinesResp.items;
}

async function getPipelineWorkflows(pipelineId) {
    const url = `https://circleci.com/api/v2/pipeline/${pipelineId}/workflow`;
    const workflowsResp = await getData(url);

    if (!workflowsResp || !workflowsResp.items){
        throw new Error("Invalid or empty response from getPipelineWorkflows()");
    }
    if(workflowsResp.items.length <= 0)
        return null;
    return workflowsResp.items ;
}


async function startLoop() {
    while(true) {
        const pipelineList = await getPipelines();

        for (const pipeline of pipelineList) {
            if (pipeline.state==="errored") continue;

            if(!pipeline.vcs || pipeline.vcs.branch !== branch) continue;

            const workflowList = await getPipelineWorkflows(pipeline.id) || [];
            if (debug) console.log(`Pipeline with num: ${pipeline.number} state: ${pipeline.state} created at: ${pipeline.created_at} vcs_revision: ${pipeline.vcs.revision} - workflow count: ${workflowList.length} by user: ${pipeline.trigger.actor.login}`);

            let anyFailedWorkflow = false;
            for(const workflow of workflowList){
                if (debug)
                    console.log(`\tWorkflow name: ${workflow.name} status: ${workflow.status}`);

                // all must be success to be considered a successful build
                // if we are on the current build, it should have running status, so not success and get s ignored
                if(workflow.status !== "success" && workflow.status !== "not_run"){
                    anyFailedWorkflow = true;
                    break;
                }
            }

            if(!anyFailedWorkflow){
                if (debug) {
                    console.log(`Last successful build commit sha is: ${pipeline.vcs.revision}`);
                } else {
                    console.log(pipeline.vcs.revision);
                }
                process.exit(0);
            }
        }

        // no more pages to fetch, exit
        if (!pipelinesNextPageToken) {
            if (debug) console.log("No more pipeline executions found, giving up.")
            process.exit(0);
        }
    }
}


processArgs();

startLoop().then(() => {
    console.log("done");
}).catch((err) => {
    console.error(err);
    process.exit(99);
})
