const process = require("process");
const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Pioche init script
 * Clone starter repository
 * npm install
 * wrangler login
 */
export function createPiocheApp(logger, dirName){
    if(dirName){
        logger.fglog(`== Creating new Pioche app ${dirName} ==`, "green");
        logger.log("Setting up project files");
        logger.begin("Cloning Pioche starter");
        try{
            execSync(`git clone https://github.com/GarrettPeake/pioche-starter.git ${dirName}`, {stdio: "pipe"});
        } catch (e){
            logger.fail("Repository not found or directory name taken");
            return;
        }
    
        if(fs.existsSync(`./${dirName}/`)){
            logger.finish(); // Cloning succeeded
            process.chdir(`./${dirName}`);
    
            // Delete .git
            logger.begin("Removing .git directory");
            if(fs.existsSync("./.git")) fs.rmSync("./.git", { recursive: true });
            logger.finish();
            
            // Delete .github
            logger.begin("Removing .github directory");
            if (fs.existsSync("./.github")) fs.rmSync("./.github", { recursive: true });
            logger.finish();
    
            // Open package.json
            logger.begin("Configuring package.json");
            const packageJson = JSON.parse(fs.readFileSync("./package.json"));
            if(!packageJson){
                logger.fail("Could not find package.json");
                return;
            }
            
            packageJson.name = dirName; // Set the name
            packageJson.version = "1.0.0"; // Set version
            delete packageJson.description; // Remove description
            delete packageJson.author; // Remove author
            
            fs.writeFileSync("./package.json", JSON.stringify(packageJson, null, 2));
            logger.finish();
    
            // Run npm install
            logger.begin("Installing project dependencies");
            execSync("npm install", {stdio: "pipe"});
            logger.finish();
    
            // Note that the project has been created successfully
            logger.fglog(`Pioche project ${dirName} created`, "green");


            // Login to wrangler
            logger.log("Configuring Wrangler");
            try{
                execSync("npm install", {stdio: "pipe"});
                logger.begin("Logged in to wrangler");
                logger.finish();
            } catch {
                logger.fgerror("Failed to login to Wrangler, use `npm wrangler login` to try again");
            }
            logger.log("See documentation at https://github.com/GarrettPeake/pioche for next steps");
    
        } else {
            logger.fail(`Failed to clone starter into directory ${dirName}`);
        }
    
    } else {
        logger.fgerror("Project name not provided");
    }
}