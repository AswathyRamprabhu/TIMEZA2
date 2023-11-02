
const sharp = require('sharp');
const fs = require('fs');

module.exports = {
    crop: async (req) => {
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                const inputFilePath = req.files[i].path;

                try {
                    const processedImageBuffer = await sharp(inputFilePath)
                        .toBuffer();

                    fs.writeFileSync(inputFilePath, processedImageBuffer);
                } catch (error) {
                    console.log("Error while processing and saving the image in prodImageCrop:", error);
                }
            }
        }
    }
};
