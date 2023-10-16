//NOTE: THIS IS A TEMPORARY SOLUTION, WILL SOLVE WITH ACTUAL API


//Anything we get from a website that doesn't provides an API

const cheerio = require("cheerio");
const axios = require("axios");

module.exports = {
    //It scrapps an image from https://www.jetphotos.com given the airplane's registration
    //Scrapping the pictures URL with cheerio
    //https://www.freecodecamp.org/news/how-to-scrape-websites-with-node-js-and-cheerio/
    async JetPhotosScrapPictures(registration) {
        return await axios(
            `https://www.jetphotos.com/photo/keyword/${registration}`
        )
            .then((response) => {
                const html = response.data;
                const $ = cheerio.load(html);

                let pictureList = [];

                //console.log($(".result__photo", html));
                const elements = $(".result__photo");

                elements.each((idx, el) => {
                    pictureList.push(el.attribs.src);
                });
                const finalPicture = this.getSecondFromListIfAny(pictureList);
                return finalPicture;
            })
            .catch(() => {
                return "Nothing";
            });
    },
    // Given a list, returns the second element if this one exists, if the list only has 1 element then returns that one
    getSecondFromListIfAny(list) {
        if (list.length === 0) {
            return undefined;
        }
        return list.length > 1 ? list[1] : list[0];
    },
};
