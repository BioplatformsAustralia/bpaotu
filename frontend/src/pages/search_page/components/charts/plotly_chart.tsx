import * as Plotly from 'plotly.js'

const icon = {
  'width': 1792,
  'path': 'M1280 192q0 26 -19 45t-45 19t-45 -19t-19 -45t19 -45t45 -19t45 19t19 45zM1536 192q0 26 -19 45t-45 19t-45 -19t-19 -45t19 -45t45 -19t45 19t19 45zM1664 416v-320q0 -40 -28 -68t-68 -28h-1472q-40 0 -68 28t-28 68v320q0 40 28 68t68 28h465l135 -136 q58 -56 136 -56t136 56l136 136h464q40 0 68 -28t28 -68zM1339 985q17 -41 -14 -70l-448 -448q-18 -19 -45 -19t-45 19l-448 448q-31 29 -14 70q17 39 59 39h256v448q0 26 19 45t45 19h256q26 0 45 -19t19 -45v-448h256q42 0 59 -39z',
  'ascent': 1792,
  'descent': 0,
};

export const plotly_chart_config = file_name => ( {
  editable: false, 
//   displayModeBar: 'hover',
  scrollZoom: false, 
  displaylogo: false,  
  // modeBarButtonsToRemove: ['hoverClosestGl2d', 'toggleSpikelines', "pan2d", "select2d", "lasso2d"],
  modeBarButtonsToRemove: ["zoom2d", "pan2d", "select2d", "lasso2d", "zoomIn2d", "zoomOut2d", "autoScale2d", "resetScale2d", "hoverClosestCartesian", 
  "hoverCompareCartesian", "zoom3d", "pan3d", "resetCameraDefault3d", "resetCameraLastSave3d", "hoverClosest3d", "orbitRotation", "tabl`eRotation", 
  "zoomInGeo", "zoomOutGeo", "resetGeo", "hoverClosestGeo", "sendDataToCloud", "hoverClosestGl2d", "hoverClosestPie", "toggleHover", 
  "resetViews", "toggleSpikelines", "resetViewMapbox", "toImage", ],
  modeBarButtonsToAdd: [{
    name: "Download plot to svg file",
    // icon: Plotly.Icons.camera,
    icon: icon,
    click: function (gd) {
        Plotly.downloadImage(gd, {
            filename: file_name.replace(" ","_").toLowerCase(),
            format: "svg",
            // width: gd._fullLayout.width,
            // height: gd._fullLayout.height
            height: 1024,
            width: 1024,
            scale: 1
        });
        }
    }
    ],
//   modeBarButtonsToAdd: [{
//     name: 'Download Plot',
//     icon: icon,
//     click: function(gd) {
//       Plotly.toImage(
//         gd,{
//           format:'svg',
//           height:1024,
//           width:1024,
//           filename: file_name.replace(" ","_").toLowerCase(),
//           scale: 1
//         });
//     }
//   }],
  // toImageButtonOptions: {
  //   format: 'svg', // one of png, svg, jpeg, webp
  //   filename: file_name.replace(" ","_").toLowerCase(),
  //   height: 1024,
  //   width: 1024,
  //   scale: 1 // Multiply title/legend/axis/canvas sizes by this factor
  // }
}
)
