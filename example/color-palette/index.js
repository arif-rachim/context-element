document.body.onload = () => {
    const palateElement = document.getElementById('palate');
    const layer = 16;
    const maximumHueColor = 360;
    const palate = 24;
    const degree = Math.round(maximumHueColor / palate );
    const saturationRange = 50;
    const lightRange = 60;
    palateElement.data = {
        input : {
            style : '',
            color : ''
        },
        palateOne : Array.from({length:layer}).map((_,id) => {
            const layerIndex = id;
            const saturation = Math.round((saturationRange / layer) * (layer - (layerIndex + 0)));
            const scale = `transform: scale(${ (1/layer) * (layer - layerIndex) });`;
            const light = Math.round((lightRange / layer) * (layer - layerIndex));
            return {
                id,
                scale,
                palateTwo : Array.from({length:(palate)}).map((_,id) =>  {
                    const color = `hsl(${degree * id},${(100 - saturationRange)+saturation}%,${light + 20 }%)`;
                    const colorStyle = `border-bottom-color: ${color} !important;`;
                    return {
                        id,
                        style:`transform: rotate(${(degree) * id}deg);`,
                        colorStyle,
                        color
                    }
                })
            }
        })
    };

    palateElement.reducer = (context,action) => {
        const {type,event,childActions} = action;
        const [levelOne,levelTwo] = childActions;

        switch (type) {
            case 'SET_COLOR' : {
                return {...context,input:{
                        style : `background-color : ${levelTwo.data.color}`,
                        color : levelTwo.data.color
                    }}
            }
        }
        return {...context};
    }
};
