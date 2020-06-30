document.body.onload = () => {
    const palateElement = document.getElementById('palate');
    const layer = 16;
    const maximumHueColor = 360;
    const palate = 24;
    const degree = Math.round(maximumHueColor / palate );
    const saturationRange = 50;
    const lightRange = 60;
    palateElement.data = {
        palateOne : Array.from({length:layer}).map((_,id) => {
            const layerIndex = id;
            const saturation = Math.round((saturationRange / layer) * (layer - (layerIndex + 0)));
            const scale = `transform : scale(${ (1/layer) * (layer - layerIndex) })`;
            const light = Math.round((lightRange / layer) * (layer - layerIndex));
            return {
                id,
                scale,
                palateTwo : Array.from({length:(palate)}).map((_,id) =>  {
                    const colorStyle = `border-bottom-color: hsl(${degree * id},${(100 - saturationRange)+saturation}%,${light + 20 }%) !important`;
                    return {
                        id,
                        style:`transform : rotate(${(degree) * id}deg)`,
                        colorStyle
                    }
                })
            }
        })
    }

    palateElement.reducer = (context,action) => {
        debugger;
        console.log(action);
        return {...context};
    }
};
