const process = require("process");
const { execSync } = require("child_process");
const fs = require("fs");

class Loggy {

    constructor(){
        this.stream = process.stdout;
        this.c = {
            fg: {
                black: "\x1b[30m",
                red: "\x1b[31m",
                green: "\x1b[32m",
                yellow: "\x1b[33m",
                blue: "\x1b[34m",
                magenta: "\x1b[35m",
                cyan: "\x1b[36m",
                white: "\x1b[37m",
                crimson: "\x1b[38m"
            },
            bg: {
                black: "\x1b[40m",
                red: "\x1b[41m",
                green: "\x1b[42m",
                yellow: "\x1b[43m",
                blue: "\x1b[44m",
                magenta: "\x1b[45m",
                cyan: "\x1b[46m",
                white: "\x1b[47m",
                crimson: "\x1b[48m"
            }
        };
    }

    log(text){
        this.stream.write((text || " ") + "\n");
    }

    begin(text){ // Write to console without newline
        this.stream.write(" > " + text);
    }

    fail(text){ // Rewrite line as ERROR:text with red background
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(this.color(` ❌ ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    finish(){ // Write a checkmark and then add the newline
        this.stream.cursorTo(0);
        this.stream.write(" ✅\n");
    }

    bgerror(text){ // Write ERROR:text in red background
        this.stream.write(this.color(`ERROR: ${text}`, this.c.bg.red) + "\n");
    }

    fgerror(text){ // Write ERROR:text in red text
        this.stream.write(this.color(`ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    fglog(input, color){
        this.stream.write(this.color(input, this.c.fg[color]) + "\n");
    }

    bglog(input, color){
        this.stream.write(this.color(input, this.c.bg[color]) + "\n");
    }

    color(input, color){
        return `${color}${input}\x1b[0m`;
    }
}

const logger = new Loggy();

switch(process.argv[2]){
    case "create" : 
        createPiocheApp();
        break;
    case "build" :
        buildPiocheApp();
        break;
    case "help" :
        printPiocheHelp();
        break;
    default :
        logger.fgerror("No command provided, see help for info");
        break;
}

/**
 * Clone starter repository
 * npm install
 * wrangler login
 */
function createPiocheApp(){
    if(process.argv[3]){
        const dirName = process.argv[3];
        logger.fglog(`== Creating new Pioche app ${dirName} ==`, "green");
        logger.log("Setting up project files");
        logger.begin("Cloning Pioche starter");
        try{
            execSync(`git clone https://github.com/GarrettPeake/pioche-starter.git ${dirName}`, {stdio: "pipe"});
        } catch {
            logger.fail("Could not find repository");
            return;
        }
    
        if(fs.existsSync(`./${dirName}/`)){
            logger.finish(); // Cloning succeeded
            process.chdir(`./${dirName}`);
    
            // Delete .git
            logger.begin("Removing .git directory");
            if(fs.existsSync("./.git")) fs.rmdirSync("./.git", { recursive: true });
            logger.finish();
            
            // Delete .github
            logger.begin("Removing .github directory");
            if (fs.existsSync("./.github")) fs.rmdirSync("./.github", { recursive: true });
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

function buildPiocheApp(){

}

function printPiocheHelp(){
    logger.log("pioche create <ProjectName>");
    logger.log(" - Create a new pioche project from a starter repository");
    logger.log(" - Preconfigured package.json, pioche.config.js, and .env");
    logger.log();
    logger.log("pioche build");
    logger.log(" - Generate an entry file to be deployed to workers");
    logger.log(" - Runs durable object migrations intelligently checking for renames");
    logger.log();
    logger.log("pioche help");
    logger.log(" - Prints this help message");
}
