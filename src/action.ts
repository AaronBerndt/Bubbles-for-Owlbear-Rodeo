import OBR, { Theme } from "@owlbear-rodeo/sdk";
import { getPluginId } from "./getPluginId";
import { barAtTopMetadataId, nameTagsMetadataId, offsetMetadataId } from "./sceneMetadataObjects";
import actionPopover from './actionPopover.html?raw';


var initDone: boolean = false; // check if on change listener has been attached yet
var roleLast: "GM" | "PLAYER";

OBR.onReady(async ()=> {

    // Handle when the scene is either changed or made ready after extension load
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            const role = await OBR.player.getRole();
            setUpActionPopover(role);
        }
    });
  
    // Check if the scene is already ready once the extension loads
    const isReady = await OBR.scene.isReady();
    if (isReady) {
        const role = await OBR.player.getRole();
        setUpActionPopover(role);
    }

    //hide settings from players
    OBR.player.onChange(async (player) => {
        //console.log(player.role);
        setUpActionPopover(player.role);
    });

    //update text on theme change
    OBR.theme.onChange(async (theme) => {
        updateActionTheme(theme);
    });

});

async function updateActionTheme(theme: Theme) {

    if (theme.mode == "LIGHT") {

        //console.log(theme)

        //change text color
        const labels = document.getElementsByClassName("action-label")
        for (let i = 0; i < labels.length; i++) {
            (labels[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const headers = document.getElementsByClassName("action-heading")
        for (let i = 0; i < headers.length; i++) {
            (headers[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const ps = document.getElementsByClassName("action-p")
        for (let i = 0; i < ps.length; i++) {
            (ps[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const hrs = document.getElementsByClassName("action-hr")
        for (let i = 0; i < hrs.length; i++) {
            (hrs[i] as HTMLLabelElement).style.borderColor = "rgba(0, 0, 0, 0.15)";
        }
    } else {

        const labels = document.getElementsByClassName("action-label")
        for (let i = 0; i < labels.length; i++) {
            (labels[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const headers = document.getElementsByClassName("action-heading")
        for (let i = 0; i < headers.length; i++) {
            (headers[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const ps = document.getElementsByClassName("action-p")
        for (let i = 0; i < ps.length; i++) {
            (ps[i] as HTMLLabelElement).style.color = theme.text.primary;
        }

        const hrs = document.getElementsByClassName("action-hr")
        for (let i = 0; i < hrs.length; i++) {
            (hrs[i] as HTMLLabelElement).style.borderColor = "rgba(255, 255, 255, 0.12)";
        }
    }
}

async function setUpActionPopover(role: "GM" | "PLAYER") {

    if(!initDone || (role !== roleLast)) {
        initDone = true;
        roleLast = role;

        if (role == "PLAYER") {
            try {
                (document.getElementById("parent") as HTMLDivElement).innerHTML = 
                `
                <p class="action-heading">
                    Settings
                </p>
    
                <hr class="action-hr">
    
                <div class="action-row">
                    <p class="action-p">Must have GM access to change settings.</p>
                </div>
                `;
            } catch (error) {
                console.log(error)
            }
        } else {
            (document.getElementById("parent") as HTMLDivElement).innerHTML = actionPopover;
            setUpInputs();
        }

        //initialize with correct theme
        const theme = await OBR.theme.getTheme();
        updateActionTheme(theme);
    }
}

async function setUpInputs() {

    //console.log("setting up inputs")

    //fill action popover based on scene metadata
    const sceneMetadata = await OBR.scene.getMetadata();
    //console.log(sceneMetadata)
    const retrievedMetadata = JSON.parse(JSON.stringify(sceneMetadata));
    try {
        const offset: any = retrievedMetadata[getPluginId("metadata")][offsetMetadataId];
        //console.log("retrieved" + offset);
        if (offset !== null && offset != "undefined") {
            //console.log("here" + offset);
            (document.getElementById(offsetMetadataId) as HTMLInputElement).value = String(offset);
        } else {
            (document.getElementById(offsetMetadataId) as HTMLInputElement).value = String(0);
        }
    } catch (error) {}
    try {
        const barAtTop: any = retrievedMetadata[getPluginId("metadata")][barAtTopMetadataId];
        //console.log("retrieved" + barAtTop);
        if (barAtTop !== null && barAtTop !== "undefined") {
            (document.getElementById(barAtTopMetadataId) as HTMLInputElement).checked = barAtTop;
        } else {
            (document.getElementById(barAtTopMetadataId) as HTMLInputElement).checked = false;
        }
    } catch (error) {}
    try {
        const nameTags: any = retrievedMetadata[getPluginId("metadata")][nameTagsMetadataId];
        //console.log("retrieved" + nameTags);
        if (nameTags !== null && nameTags !== "undefined") {
            (document.getElementById(nameTagsMetadataId) as HTMLInputElement).checked = nameTags;
        } else {
            (document.getElementById(nameTagsMetadataId) as HTMLInputElement).checked = false;
        }
    } catch (error) {}

    // offset bar
    (document.getElementById(offsetMetadataId) as HTMLInputElement).addEventListener("change", async (event) => {

        // create metadata object based on user input
        const offset = parseFloat((event.target as HTMLInputElement).value);
        let newMetadata = {[offsetMetadataId]: offset}

        updateSceneMetadata(newMetadata);
    });

    // bar above token
    (document.getElementById(barAtTopMetadataId) as HTMLInputElement).addEventListener("change", async (event) => {

        // create metadata object based on user input
        const barAtTop = (event.target as HTMLInputElement).checked;
        let newMetadata = {[barAtTopMetadataId]: barAtTop};

        updateSceneMetadata(newMetadata);
    });

    //name tags
    (document.getElementById(nameTagsMetadataId) as HTMLInputElement).addEventListener("change", async (event) => {

        // create metadata object based on user input
        const nameTags = (event.target as HTMLInputElement).checked;
        let newMetadata = {[nameTagsMetadataId]: nameTags};

        updateSceneMetadata(newMetadata);
    });
}

async function updateSceneMetadata(newMetadata: any) {

    //console.log("updating scene metadata")

    // get scene metadata
    const sceneMetadata = await OBR.scene.getMetadata();
    //console.log(sceneMetadata)

    const retrievedMetadata = JSON.parse(JSON.stringify(sceneMetadata))[getPluginId("metadata")];

    // combine metadata
    const combinedMetadata = {...retrievedMetadata, ...newMetadata} //overwrite only the updated item

    //write metadata into scene
    OBR.scene.setMetadata({[getPluginId("metadata")]: combinedMetadata});
}