var db = PouchDB('csv_db');

$(document).ready(function() {

    $(document).tooltip();

    // Event listeners for the file upload and clear file list button
    document.getElementById('txt-file-upload').addEventListener('change', upload, false);
    document.getElementById('clear-db').addEventListener('click', clearDb, false);

    /**
     *
     * On Start
     *
     **/
    // @todo: mv. only this execute in the onReady. Others below.
    renderFileList();

    if (localStorage.getItem("displaydata")) {
        displayLocalData();
    }

});

/**
 *
 * UPLOAD METHODS
 *
 **/


/**
 * Method that checks that the browser supports the HTML5 File API
 *
 * @returns {boolean}
 */
// @todo: mv. supports
function browserSupportFileUpload() {
    var isCompatible = false;

    if (window.File && window.FileReader && window.FileList && window.Blob) {
        isCompatible = true;
    }
    return isCompatible;
}

/**
 * Method that reads and processes the selected file
 * @param evt
 */
// @todo: mv. uploadCSV
function upload(evt) {
    if (!browserSupportFileUpload()) {
        alert('The File APIs are not fully supported in this browser!');
    } else {
        var data = null;
        var file = evt.target.files[0];
        var filename = evt.target.files[0].name;
        var reader = new FileReader();
        reader.readAsText(file);

        reader.onload = function(event) {
            var csvData = event.target.result;
            new_data = $.csv.toArrays(csvData);
            saveUpload(filename, new_data);
        };
        reader.onerror = function() {
            alert('Unable to read ' + file.fileName);
        };
    }
}

/**
 * Method that adds an uploaded file to localStorage and sets the displaydata and currentfile to the uploaded file
 *
 * @param {string} filename
 * @param {object} data
 */
function saveUpload(filename, data) {
    var timestamp = new Date().toISOString();
    var upload = {
        _id: timestamp,
        filename: filename,
        data: data,
        lasteditdate: formatDate(new Date())
    };

    db.put(upload).then(function (response) {
        console.log(response);
        localStorage.setItem("currentid", response.id);
        localStorage.setItem("currentfile", upload.filename);
        localStorage.setItem("displaydata", JSON.stringify(upload.data));
        displayLocalData();
        showGraph();
        renderFileList();
    }).catch(function (error) {
        console.log(error);
    });
}

/**
 * Method for formatting date/time
 *
 * @param time
 * @returns {string}
 */
// @todo: as what...
function formatDate(time) {
    var am_or_pm = "am";
    var hours = time.getHours();
    if (hours > 12) {
        hours = hours - 12;
        am_or_pm = "pm";
    } else if(hours = 12) {
        am_or_pm = "pm";
    }
    return hours-2 + ":" + ("0" + time.getMinutes()).slice(-2) + am_or_pm + " " + ("0"+(time.getMonth()+1)).slice(-2)
        + "-" + ("0" + time.getDate()).slice(-2) + "-" + ("0" + time.getFullYear()).slice(-2);
}

/**
 *
 * FILE LIST METHODS
 *
 **/

/**
 * Method for rendering the file list to the page
 */
function renderFileList() {

    var displaySelectedData = function() {
        var key = this.id;
        db.get(key).then(function(response) {
            console.log(response);
            localStorage.setItem("currentid", key);
            localStorage.setItem("currentfile", response.filename);
            localStorage.setItem("displaydata", JSON.stringify(response.data));
            displayLocalData();
        });
    };

    var deleteSelectedData = function() {
        var csv_to_delete = this.getAttribute('data-id');
        db.get(csv_to_delete).then(function (doc) {
            db.remove(doc);
            renderFileList();
        }).then(function() {
            if( csv_to_delete === localStorage.getItem("currentid")) {
                clearDisplayData();
            }
        });
    };

    //Clear the old file list
    $("#file-list").html('');

    db.allDocs({include_docs: true, descending: true}, function(err, doc) {
        if (!err) {
            var allfiles =  doc.rows;

            for (var i = 0; i < allfiles.length; i++) {

                var filename = allfiles[i].doc.filename;
                var filekey = allfiles[i].id;
                var lasteditdate = allfiles[i].doc.lasteditdate;
                var fileListRow = function () {
                    return [
                        '<div class="file-list-row">',
                            '<div class="file-list-item col-md-9">',
                                '<div id="'+filekey+'" class="file">',
                                    '<a>' + filename + '</a>',
                                '</div>',
                                '<div class="file-date">Last Update: ' + lasteditdate + '</div>',
                            '</div>',
                            '<div class="file-list-item col-md-2">',
                                '<div id="'+filekey+filename+'" class="btn btn-danger btn-sm remove-file" title="Remove file from DB" data-id="'+filekey+'">',
                                    '<span class="glyphicon glyphicon-trash"></span>',
                                '</div>',
                            '</div>',
                        '</div>'
                    ].join('');
                };

                $("#file-list").append(fileListRow);
                document.getElementById(filekey).addEventListener('click', displaySelectedData, false);
                document.getElementById(filekey+filename).addEventListener('click', deleteSelectedData, false);
            }
        }
    })
        .catch(function(err) {
            console.log("No Files To Retrieve");
        });
}

/**
 * Method for clearing the entire DB of files
 */
function clearDb() {
    db.destroy().then(function() {
        renderFileList();
        clearDisplayData();
    });
    document.location.reload(true);
}

/**
 *
 * AG-GRID DISPLAY METHODS
 *
 **/

//Method for displaying an new ag-grid using the current localstorage data
function displayLocalData() {
    var csvData = JSON.parse(localStorage.getItem("displaydata"));
    removeAgGrid();
    removeGraph();
    addAgGrid(csvData);
}

//Method to clear localStorage and the file upload value, remove the ag-Grid, and hide the clear data button
function clearDisplayData() {
    localStorage.removeItem("displaydata");
    $("#txtFileUpload").val('');
    $("#clear-data").hide();
    $("#export").hide();
    $("#ag-grid-header").html('');
    removeAgGrid();
    removeGraph();
}

//Method to clear the contents of the grid and its header
function removeAgGrid() {
    $("#ag-grid").html('');
}

/**
 * Method to add an ag-Grid to the page
 *
 * @param {array} data
 */

function addAgGrid(data) {
    var columnDefs = [];
    var rowData = [];
    var currentFileName = localStorage.getItem("currentfile");
    var file_id = localStorage.getItem("currentid");
    $("#ag-grid-header").html('<div class="grid-header"><h3>Upload Results for '+currentFileName+'</h3></div>');
    for (var i = 0; i < data[0].length; i++) {
        var header = data[0][i];
        columnDefs.push({
            headerName: header,
            field: header.toLowerCase(),
            editable: true,
            cellEditor: 'text'
        });
    }
    for (var i = 1; i < data.length; i++) {
        var rowObject = {};

        for (var j = 0; j < data[i].length; j++) {
            var rowObjectKey = data[0][j].toLowerCase();
            rowObject[rowObjectKey] = data[i][j];
        }
        rowData.push(rowObject);
    }
    var gridOptions = {
        columnDefs: columnDefs,
        enableColResize: true,
        enableFilter: true,
        enableSorting: true
    };
    //Method for exporting the displayed CSV
    var onExport = function() {
        var exportParams = {
            fileName: currentFileName
        };
        gridOptions.api.exportDataAsCsv(exportParams);
    };
    //Method for saving updated CSV
    var onSave = function() {
        var exportParams = {
            fileName: currentFileName
        };
        var savedCSV = gridOptions.api.getDataAsCsv(exportParams);
        var savedData = $.csv.toArrays(savedCSV);
        var saveDate = formatDate(new Date());

        db.get(file_id).then(function(doc) {
            localStorage.setItem("displaydata", JSON.stringify(savedData));
            return db.put({
                _id: file_id,
                _rev: doc._rev,
                filename: currentFileName,
                data: savedData,
                lasteditdate: saveDate
            });
        }).then(function(response) {
            renderFileList();
            showGraph();
            // alert("Successfully Saved CSV.");
        }).catch(function(err) {
            console.log(err);
        })
    };
    //Add ag-Grid to the page with the defined grid options
    var eGridDiv = document.querySelector('#ag-grid');
    new agGrid.Grid(eGridDiv, gridOptions);
    //Add the row data to the grid
    gridOptions.api.setRowData(rowData);
    //Add save, download, and clear buttons to the grid header and attach their event listeners
    var agGridButtonSet = function () {
        return [
            '<div class="grid-header-buttons" id="grid-buttons">',
                '<div id="show-graph" class="btn btn-warning buttons" title="Show Scatter Plot">',
                    '<span class="glyphicon glyphicon-equalizer"></span>',
                '</div>',
                '<div id="save" class="btn btn-primary buttons" title="Save CSV">',
                    '<span class="glyphicon glyphicon-floppy-disk"></span>',
                '</div>',
                '<div id="export" class="btn btn-success buttons" title="Download CSV">',
                    '<span class="glyphicon glyphicon-download-alt"></span>',
                '</div>',
                '<div id="clear-data" class="btn btn-danger buttons" title="Remove Grid">',
                    '<span class="glyphicon glyphicon-remove"></span>',
                '</div>',
            '</div>'
        ].join('');
    };
    $("#ag-grid-header").append(agGridButtonSet());
    document.getElementById('clear-data').addEventListener('click', clearDisplayData, false);
    document.getElementById('export').addEventListener('click', onExport, false);
    document.getElementById('save').addEventListener('click', onSave, false);
    document.getElementById('show-graph').addEventListener('click', showGraph, false);
}

/**
 *
 * Highcharts
 *
 **/

function showGraph() {
    var currentFileName_graph = localStorage.getItem("currentfile");
    var file_id_graph = localStorage.getItem("currentid");
    var xAxisLabel = "";
    var yAxisLabel = "";
    var scatterData = [];
    //Function for setting the scatter plot data with selected x axis column, y axis column, and the dataset
    var setScatterData = function(xcolnum, ycolnum, data) {
        scatterData = [];

        xAxisLabel = data[0][xcolnum];
        yAxisLabel = data[0][ycolnum];

        for (var i = 1; i < data.length; i++) {
            scatterData.push([parseFloat(data[i][xcolnum]), parseFloat(data[i][ycolnum])]);
        }
    };

    var axisSelectOptions = function () {
        return [
            '<div id="axis-select-container">',
                '<div class="col-sm-6">',
                    '<h4>Choose Which Columns To Graph</h4>',
                '</div>',
                '<div class="x-axis-container col-sm-2">',
                    '<div>X Axis: </div>',
                    '<select name="x-axis" id="x-axis-select"></select>',
                '</div>',
                '<div class="y-axis-container col-sm-2">',
                    '<div>Y Axis: </div>',
                    '<select name="y-axis" id="y-axis-select"></select>',
                '</div>',
            '</div>',
            '<div id="scatter-graph-container"></div>'
        ].join('');
    };

    removeGraph();
    $('#graph-container').html(axisSelectOptions);
    $('#scatter-graph-container').html('<div id="scatter-plot-container" class="col-xs-12"><div id="scatter-plot"></div></div>');

    db.get(file_id_graph).then(function(response) {
        var xcol = 0;
        var ycol = 1;

        // @todo - ask angelo how to get this down to one for loop
        //Add columns as select options for dropdowns
        for (var i = 0; i < response.data[0].length; i++) {
            //Validation to see if the first 3 values in a column contain numbers. If they do, add the column to the list
            if ((!isNaN(response.data[1][i]))&&(!isNaN(response.data[2][i]))&&(!isNaN(response.data[3][i]))) {
                var o = new Option(response.data[0][i], response.data[0][i]);
                /// jquerify the DOM object 'o' so we can use the html method
                $(o).html(response.data[0][i]);
                $("#x-axis-select").append(o);
            }
        }
        for (var i = 0; i < response.data[0].length; i++) {
            //Validation to see if the first 3 values in a column contain numbers. If they do, add the column to the list
            if (!isNaN(response.data[1][i])) {
                var o = new Option(response.data[0][i], response.data[0][i]);
                /// jquerify the DOM object 'o' so we can use the html method
                $(o).html(response.data[0][i]);
                $("#y-axis-select").append(o);
            }

        }
        //Add event listeners for dropdowns
        document.getElementById('x-axis-select').addEventListener('change', setXAxis, false);
        document.getElementById('y-axis-select').addEventListener('change', setYAxis, false);

        //Function to set the X Axis and redraw graph
        function setXAxis() {
            for (var i = 0; i < response.data[0].length; i++) {
                if ( response.data[0][i] === $("#x-axis-select").val()) {
                    xcol = i;
                }
            }
            setScatterData(xcol, ycol, response.data);
            graphChart();
        }
        //Function to set the Y Axis and redraw graph
        function setYAxis() {
            for (var i = 0; i < response.data[0].length; i++) {
                if ( response.data[0][i] === $("#y-axis-select").val()) {
                    ycol = i;
                }
            }
            setScatterData(xcol, ycol, response.data);
            graphChart();
        }
        //Add the Scatter plot to the page with the given configuration options
        function graphChart() {

            $('#scatter-plot').highcharts({
                chart: {
                    type: 'scatter',
                    zoomType: 'xy'
                },
                title: {
                    text: currentFileName_graph
                },
                subtitle: {
                    text: 'Scatter Plot'
                },
                xAxis: {
                    title: {
                        enabled: true,
                        text: xAxisLabel
                    },
                    startOnTick: true,
                    endOnTick: true,
                    showLastLabel: true
                },
                yAxis: {
                    title: {
                        text: yAxisLabel
                    }
                },
                plotOptions: {
                    scatter: {
                        marker: {
                            radius: 5,
                            states: {
                                hover: {
                                    enabled: true,
                                    lineColor: 'rgb(100,100,100)'
                                }
                            }
                        },
                        states: {
                            hover: {
                                marker: {
                                    enabled: false
                                }
                            }
                        },
                        tooltip: {
                            headerFormat: '<b>{series.name}</b><br>',
                            pointFormat: '{point.x}, {point.y}'
                        }
                    }
                },
                series: [{
                    name: xAxisLabel + ' x ' + yAxisLabel,
                    color: 'rgba(223, 83, 83, .5)',
                    data: scatterData

                }]
            });
        }
        //Initially set both Axis to show graph when the button is clicked
        setXAxis();
        setYAxis();
    });
}

function removeGraph() {
    $("#axis-select-container").html('');
    $("#scatter-plot-container").html('');
}