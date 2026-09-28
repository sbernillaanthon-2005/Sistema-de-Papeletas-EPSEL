<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Calibrador PDF</title>
    <style>
        body { margin: 0; padding: 0; background: #333; }
        @php
            $bgPath = resource_path('images/Autorizacion_salida_practicante_EPSEL_Full_HD.png');
            $bgData = file_exists($bgPath) ? base64_encode(file_get_contents($bgPath)) : '';
        @endphp
        .container { position: relative; width: 1123px; height: 794px; background: url('data:image/png;base64,{{ $bgData }}'); background-size: cover; margin: 20px; box-shadow: 0 0 20px rgba(0,0,0,0.5); }
        .draggable { position: absolute; border: 1px dashed red; background: rgba(255,255,255,0.7); cursor: move; font-family: 'Helvetica', Arial, sans-serif; font-size: 14px; padding: 2px; }
        #output { position: fixed; top: 0; right: 0; background: #f8fafc; padding: 20px; border-left: 2px solid #cbd5e1; z-index: 1000; width: 350px; height: 100vh; overflow: auto; box-sizing: border-box; font-family: sans-serif; }
        textarea { width: 100%; height: 500px; font-family: monospace; font-size: 12px; }
        button { background: #4f46e5; color: white; border: none; padding: 10px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 10px; border-radius: 5px; }
        p { font-size: 13px; color: #475569; line-height: 1.5; }
    </style>
</head>
<body>
    <div id="output">
        <h3>Calibrador de Plantilla</h3>
        <p>Arrastra los textos rojos sobre la imagen para ubicarlos exactamente donde deseas que aparezcan en el PDF final.</p>
        <p>Cuando termines, copia el código CSS generado abajo y reemplázalo en el archivo <code>resources/views/pdf/exit-slip.blade.php</code>, o pásamelo por el chat y yo lo haré por ti.</p>
        <textarea id="cssOutput"></textarea>
    </div>
    <div class="container" id="container">
        <!-- Elements will be here -->
    </div>
    <script>
        const fields = {
            'f-fecha-emision-0': { top: 32, left: 790, text: '2', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-emision-1': { top: 32, left: 820, text: '8', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-emision-2': { top: 32, left: 850, text: '0', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-emision-3': { top: 32, left: 880, text: '9', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-emision-4': { top: 32, left: 910, text: '2', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-emision-5': { top: 32, left: 940, text: '6', styles: 'font-weight: bold; padding: 2px 5px;' },
            
            'f-apellidos': { top: 190, left: 180, text: 'Izasiga Cruz' },
            'f-nombres': { top: 218, left: 180, text: 'Jose Luizinho' },
            'f-cargo': { top: 218, left: 450, text: 'Practicante Pre Profesional' },
            
            'f-mot-essalud': { top: 330, left: 75, text: 'X', styles: 'font-size: 20px; font-weight: bold;' },
            'f-mot-personal': { top: 405, left: 75, text: 'X', styles: 'font-size: 20px; font-weight: bold;' },
            'f-mot-comision': { top: 480, left: 75, text: 'X', styles: 'font-size: 20px; font-weight: bold;' },
            'f-mot-otros': { top: 560, left: 75, text: 'X', styles: 'font-size: 20px; font-weight: bold;' },
            
            'f-detalle': { top: 335, left: 420, text: 'Compra de PC (Detalle del motivo)', styles: 'width: 500px;' },
            
            'f-fecha-aut-0': { top: 385, left: 350, text: '2', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-1': { top: 385, left: 380, text: '8', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-2': { top: 385, left: 410, text: '0', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-3': { top: 385, left: 440, text: '9', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-4': { top: 385, left: 470, text: '2', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-5': { top: 385, left: 500, text: '0', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-6': { top: 385, left: 530, text: '2', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-fecha-aut-7': { top: 385, left: 560, text: '6', styles: 'font-weight: bold; padding: 2px 5px;' },
            'f-hora-desde': { top: 385, left: 790, text: '08:00' },
            'f-hora-hasta': { top: 385, left: 880, text: '10:00' },
            
            'f-firma-prac': { top: 500, left: 260, text: '[Imagen Firma Practicante]', styles: 'width: 140px; height: 90px; border: 2px solid blue;' },
            'f-firma-jefe': { top: 500, left: 450, text: '[Imagen Firma Jefe]', styles: 'width: 140px; height: 90px; border: 2px solid blue;' },
            'f-firma-rrhh': { top: 500, left: 820, text: '[Imagen Firma RRHH]', styles: 'width: 140px; height: 90px; border: 2px solid blue;' }
        };

        const container = document.getElementById('container');
        const cssOutput = document.getElementById('cssOutput');

        function updateCss() {
            let css = '/* COORDENADAS EXPORTADAS DESDE EL CALIBRADOR */\n';
            document.querySelectorAll('.draggable').forEach(el => {
                css += `.${el.id} { top: ${el.style.top}; left: ${el.style.left}; }\n`;
            });
            cssOutput.value = css;
        }

        Object.keys(fields).forEach(key => {
            const el = document.createElement('div');
            el.className = 'draggable';
            el.id = key;
            el.style.top = fields[key].top + 'px';
            el.style.left = fields[key].left + 'px';
            el.innerText = fields[key].text;
            if (fields[key].styles) {
                el.style.cssText += fields[key].styles;
            }
            container.appendChild(el);

            let isDragging = false;
            el.addEventListener('mousedown', function(e) {
                isDragging = true;
                let startX = e.clientX - el.offsetLeft;
                let startY = e.clientY - el.offsetTop;
                function onMouseMove(e) {
                    if (!isDragging) return;
                    el.style.left = (e.clientX - startX) + 'px';
                    el.style.top = (e.clientY - startY) + 'px';
                    updateCss();
                }
                function onMouseUp() {
                    isDragging = false;
                    document.removeEventListener('mousemove', onMouseMove);
                    document.removeEventListener('mouseup', onMouseUp);
                }
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
            });
        });
        updateCss();
    </script>
</body>
</html>
