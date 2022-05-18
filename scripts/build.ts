const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const toml = require("@iarna/toml");
const cwd = require("process").cwd();

/**
 * Pioche build script
 * Intakes pioche.config.js
 * Creates entry.ts
 * Creates wrangler.toml
 * Processes migrations
 */

// TODO: Generate wrangler.toml
// import + export from entry.ts
// import everything, list everything to prevent shaking, then reexport durable objects.
export function buildPiocheApp(logger){
    logger.fglog("== Building pioche app ==", "green");

    // Import our config
    logger.begin("Opening pioche.config.js from cwd");
    let config = {};

    try{
        config = require(path.join(path.relative(__dirname, cwd), "pioche.config"));
        logger.finish();
    } catch (e) {
        logger.fail("No pioche.config.js exists, ensure you're in correct folder");
        logger.bgerror(e);
        return;
    }
    console.log(config);

    // Open and parse our .env file
    logger.begin("Opening and parsing .env");
    let dotenv = {};
    try{
        dotenv = require("dotenv").config().parsed;
        logger.finish();
    } catch (e) {
        logger.info("No .env file in directory, created default", "green");
        dotenv = createDefaultDotenv();
    }
    console.log(dotenv);

    // Open and parse our wrangler.toml file
    logger.begin("Opening and parsing wrangler.toml");
    let wranglerToml = {};
    try{
        const tomlRaw = fs.readFileSync(path.join(cwd, "wrangler.toml"), "utf8");
        if(tomlRaw){
            try{
                wranglerToml = toml.parse(tomlRaw);
            } catch (e: any) {
                logger.error("Error parsing wrangler.toml on line " + e.line + ", column " +
                e.column + ": " + e.message);
                return;
            }
        }
    } catch {
        logger.info("No wrangler.toml found, creating with defaults");
    }
    console.log(wranglerToml);
    updateWranglerToml(wranglerToml, config, dotenv);

    // Generate our entry file
    generateEntry(config);
}

/**
 * Creates an updated wrangler.toml with migrations, bindings, and build command set
 * @param contents Contents of the original wrangler.toml
 * @param config pioche.config.js config file
 */
function updateWranglerToml(contents, config, dotenv){
    const header =
        "# ============================================================================\n" +
        "# Required for workers runtime, never commit this file\n" +
        "# Pioche build process overwrites all bindings, migrations, and build commands\n" +
        "# ============================================================================\n\n";
    // TODO: Generate all contents from the config
    if(!(contents && contents.durable_objects && contents.durable_objects.bindings)){
        contents.durable_objects = {
            bindings: []
        };
    }

    if(!contents.migrations){ contents.migrations = []; }
    // Write out the new file
    const tomlOutputString = header + toml.stringify(contents);
    fs.writeFileSync(path.join(cwd, "wrangler.toml"), tomlOutputString);
}

function generateEntry(config){
    const header =
        "// ===================================================\n" +
        "// Created automatically, edits won't have any effect\n" +
        "// ===================================================\n\n" +
        "import { DefaultHandlers } from \"pioche\";\n";

    const footer = "export default DefaultHandlers;\n";
    // TODO: WE could just copy the import statements from the config file
    const entryContents = "";
    config.controllers?.forEach((controller) => {
        console.log(controller);
    });
    // Write the file
    fs.writeFileSync(path.join(cwd, "src/entry.ts"),  header + entryContents + footer);
}

function createDefaultDotenv() {
    const key = crypto.randomBytes(32).toString("hex");
    const contents =
        "# =============================================\n" +
        "# Define environment variables here\n" +
        "# Never commit your .env file\n"+
        "# =============================================\n\n"+
        `JWT_SECRET=${key}`;
    // Write the file
    fs.writeFileSync(path.join(cwd, "/.env"), contents);
    return {JWT_SECRET: key};
}