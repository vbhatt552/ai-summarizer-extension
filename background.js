chrome.runtime.onInstalled.addListener(()=>{
    chrome.storage.sync.get(["geminiApikey"],(result)=>{
        if(!result.geminiApiKey){
            chrome.tabs.create({url:"options.html"});
        }
    });
});