import Canvas from "canvas";
import { AttachmentBuilder } from "discord.js";

async function canvasCreate(data: {
    emblemPath: string;
    name: string;
    playerTitle: string;
    light: number;
    artifactPower: number;
    raceClass: string;
    seasonRank: number;
    timePlayedHours: number;
    timePlayedMinutes: number;
    kdaPVP: string;
    kdaPVE: string;
}) {
    //Declarations
    const {
        emblemPath,
        name,
        playerTitle,
        raceClass,
        seasonRank,
        light,
        artifactPower,
        timePlayedHours,
        timePlayedMinutes,
        kdaPVP,
        kdaPVE,
    } = data;
    //Registering fonts
    Canvas.registerFont("Roboto-BoldItalic.ttf", {
        family: "Roboto Bold Italic",
    });
    Canvas.registerFont("Roboto-Bold.ttf", { family: "Roboto Bold" });
    const canvas = Canvas.createCanvas(474, 96);
    const ctx = canvas.getContext("2d");
    //Declarations
    if (emblemPath == "https://bungie.netundefined") {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        const background = await Canvas.loadImage(emblemPath).catch((error) =>
            console.log(error)
        );
        if (background) {
            ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        }
    }
    const lightIcon = await Canvas.loadImage("light.png").catch((error) =>
        console.log(error)
    );
    //Adding Username to canvas
    ctx.shadowColor = "black";
    ctx.shadowBlur = 15;
    ctx.font = "25px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.lineWidth = 0.25;
    ctx.fillText(name, 96, canvas.height * 0.3);
    ctx.strokeText(name, 96, canvas.height * 0.3);
    //Adding Title to canvas
    ctx.font = "18px Roboto Bold Italic";
    ctx.fillStyle = "#9c6397";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(playerTitle, 96, canvas.height * 0.52);
    ctx.strokeText(playerTitle, 96, canvas.height * 0.52);
    //Adding Gender, Race and class to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(raceClass, 96, canvas.height * 0.76);
    ctx.strokeText(raceClass, 96, canvas.height * 0.76);
    //Adding Season Rank to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
        "Season Rank: " + seasonRank,
        canvas.width - 8 - ctx.measureText("Season Rank: " + seasonRank).width,
        canvas.height * 0.76
    );
    ctx.strokeText(
        "Season Rank: " + seasonRank,
        canvas.width - 8 - ctx.measureText("Season Rank: " + seasonRank).width,
        canvas.height * 0.76
    );
    //Adding Time Played for character to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
        timePlayedHours + "h " + timePlayedMinutes + "m",
        96,
        canvas.height * 0.96
    );
    ctx.strokeText(
        timePlayedHours + "h " + timePlayedMinutes + "m",
        96,
        canvas.height * 0.96
    );
    //Adding Destiny 2 Light Level to canvas
    ctx.font = "32px Roboto Bold";
    ctx.fillStyle = "#e2d259";
    ctx.strokeStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(light.toString(), canvas.width - 8, (canvas.height / 2) * 0.7);
    ctx.strokeText(
        light.toString(),
        canvas.width - 8,
        (canvas.height / 2) * 0.7
    );
    if (lightIcon) {
        ctx.drawImage(
            lightIcon,
            canvas.width - 32 - ctx.measureText(light.toString()).width,
            canvas.height * 0.06,
            32,
            32
        );
    }
    //Adding Destiny 2 Artifact Power to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#09d7d0";
    ctx.strokeStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(" + " + artifactPower, canvas.width - 8, canvas.height * 0.56);
    ctx.strokeText(
        " + " + artifactPower,
        canvas.width - 8,
        canvas.height * 0.56
    );
    //Adding Base to canvas
    var base = light - artifactPower;
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(
        base.toString(),
        canvas.width - 8 - ctx.measureText(" + " + artifactPower).width,
        canvas.height * 0.56
    );
    ctx.strokeText(
        base.toString(),
        canvas.width - 8 - ctx.measureText(" + " + artifactPower).width,
        canvas.height * 0.56
    );
    //Adding PvP value to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(
        kdaPVP.toString(),
        canvas.width - 12 - ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    ctx.strokeText(
        kdaPVP.toString(),
        canvas.width - 12 - ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    //Adding PvE value to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "right";
    ctx.fillText(kdaPVE, canvas.width - 8, canvas.height * 0.96);
    ctx.strokeText(kdaPVE, canvas.width - 8, canvas.height * 0.96);
    //Adding 'PvP KDA' to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
        "PvP:",
        canvas.width -
            12 -
            ctx.measureText("PvP: " + kdaPVP).width -
            ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    ctx.strokeText(
        "PvP:",
        canvas.width -
            12 -
            ctx.measureText("PvP: " + kdaPVP).width -
            ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    //Adding 'PvE KDA' to canvas
    ctx.font = "18px Roboto Bold";
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "black";
    ctx.textAlign = "left";
    ctx.fillText(
        "PvE:",
        canvas.width - 8 - ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    ctx.strokeText(
        "PvE:",
        canvas.width - 8 - ctx.measureText("PvE: " + kdaPVE).width,
        canvas.height * 0.96
    );
    //Converting canvas to discord attachment
    var attachment = new AttachmentBuilder(canvas.toBuffer(), {
        name: name.replace(/[^\w.]/g, "_") + ".jpg",
    });
    return attachment;
}

export default canvasCreate;
