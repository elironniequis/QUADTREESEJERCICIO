document.getElementById('decomposeButton').addEventListener('click', decomposeImage);
document.getElementById('imageUpload').addEventListener('change', handleImageUpload);

function handleImageUpload(event) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            drawImageOnCanvas(img, 'originalCanvas');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(event.target.files[0]);
}

function drawImageOnCanvas(img, canvasId) {
    const canvas = document.getElementById(canvasId);
    const context = canvas.getContext('2d');
    canvas.width = img.width;
    canvas.height = img.height;
    context.drawImage(img, 0, 0);
}

function decomposeImage() {
    const originalCanvas = document.getElementById('originalCanvas');
    const originalContext = originalCanvas.getContext('2d');
    const imageData = originalContext.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
    const decomposedCanvas = document.getElementById('decomposedCanvas');
    const decomposedContext = decomposedCanvas.getContext('2d');

    decomposedCanvas.width = originalCanvas.width;
    decomposedCanvas.height = originalCanvas.height;

    const threshold = 30; // Umbral de variación de color para decidir si subdividir

    function quadTree(x, y, width, height) {
        const region = getRegionData(imageData, x, y, width, height);
        const avgColor = getAverageColor(region);
        const variance = getColorVariance(region, avgColor);

        if (variance < threshold || width <= 8 || height <= 8) {
            drawBlock(decomposedContext, x, y, width, height, avgColor);
        } else {
            const halfWidth = Math.floor(width / 2);
            const halfHeight = Math.floor(height / 2);
            quadTree(x, y, halfWidth, halfHeight);
            quadTree(x + halfWidth, y, halfWidth, halfHeight);
            quadTree(x, y + halfHeight, halfWidth, halfHeight);
            quadTree(x + halfWidth, y + halfHeight, halfWidth, halfHeight);
        }
    }

    quadTree(0, 0, originalCanvas.width, originalCanvas.height);
}

function getRegionData(imageData, x, y, width, height) {
    const { data, width: imgWidth } = imageData;
    const region = [];
    for (let j = 0; j < height; j++) {
        for (let i = 0; i < width; i++) {
            const pixelX = x + i;
            const pixelY = y + j;
            if (pixelX < imgWidth && pixelY < imgWidth) {
                const index = (pixelY * imgWidth + pixelX) * 4;
                region.push({
                    r: data[index],
                    g: data[index + 1],
                    b: data[index + 2],
                    a: data[index + 3]
                });
            }
        }
    }
    return region;
}

function getAverageColor(region) {
    const sum = region.reduce((acc, val) => {
        acc.r += val.r;
        acc.g += val.g;
        acc.b += val.b;
        acc.a += val.a;
        return acc;
    }, { r: 0, g: 0, b: 0, a: 0 });

    const len = region.length;
    return {
        r: Math.floor(sum.r / len),
        g: Math.floor(sum.g / len),
        b: Math.floor(sum.b / len),
        a: Math.floor(sum.a / len)
    };
}

function getColorVariance(region, avgColor) {
    const sumSqDiff = region.reduce((acc, val) => {
        acc += Math.pow(val.r - avgColor.r, 2) + Math.pow(val.g - avgColor.g, 2) + Math.pow(val.b - avgColor.b, 2);
        return acc;
    }, 0);

    return sumSqDiff / region.length;
}

function drawBlock(context, x, y, width, height, color) {
    context.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a / 255})`;
    context.fillRect(x, y, width, height);
    context.lineWidth = 0.5; // Grosor de línea más delgada
    context.strokeStyle = 'rgba(0, 0, 0, 0.5)'; // Color de la línea
    context.strokeRect(x, y, width, height);
}