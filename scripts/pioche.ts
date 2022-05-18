#!/usr/bin/env node
import  process from "process";
import { createPiocheApp } from "./init";
import { buildPiocheApp } from "./build";

class Loggy {

    stream = process.stdout;
    c = {
        fg: {
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            cyan: "\x1b[36m",
        },
        bg: {
            red: "\x1b[41m",
            green: "\x1b[42m",
            yellow: "\x1b[43m",
            blue: "\x1b[44m",
            cyan: "\x1b[46m"
        }
    };

    log(text?: string){
        this.stream.write((text || "") + "\n");
    }

    begin(text: string){ // Write to console without newline
        this.stream.write(" > " + text);
    }

    fail(text: string){ // Rewrite line as ERROR:text with red background
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(this.color(` ❌ ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    info(text: string){ // Rewrite line as INFO:text with yellow text
        this.stream.cursorTo(0);
        this.stream.clearLine(1);
        this.stream.write(this.color(` ✅ INFO: ${text}`, this.c.fg.yellow) + "\n");
    }

    finish(){ // Write a checkmark and then add the newline
        this.stream.cursorTo(0);
        this.stream.write(" ✅\n");
    }

    bgerror(text: string){ // Write ERROR:text in red background
        this.stream.write(this.color(`ERROR: ${text}`, this.c.bg.red) + "\n");
    }

    fgerror(text: string){ // Write ERROR:text in red text
        this.stream.write(this.color(`ERROR: ${text}`, this.c.fg.red) + "\n");
    }

    fglog(input: string, color: string){
        this.stream.write(this.color(input, this.c.fg[color]) + "\n");
    }

    bglog(input: string, color: string){
        this.stream.write(this.color(input, this.c.bg[color]) + "\n");
    }

    color(input: string, color: string){
        return `${color}${input}\x1b[0m`;
    }
}

const logger = new Loggy();

switch(process.argv[2]){
    case "create" : 
        createPiocheApp(logger, process.argv[3]);
        break;
    case "build" :
        buildPiocheApp(logger);
        break;
    case "help" :
        printPiocheHelp();
        break;
    default :
        logger.fgerror("No command provided, see help for info");
        break;
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
