$( document ).ready(function() {

    var eGridDiv = document.querySelector('#ag-grid');

    // Event listeners for the file upload and clear data button
    document.getElementById('txtFileUpload').addEventListener('change', upload, false);

    // Method that checks that the browser supports the HTML5 File API
    function browserSupportFileUpload() {
        var isCompatible = false;

        if (window.File && window.FileReader && window.FileList && window.Blob) {
            isCompatible = true;
        }
        return isCompatible;
    }

    // Method that reads and processes the selected file
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
                data = $.csv.toArrays(csvData);
                localStorage.setItem("displaydata", JSON.stringify(data));
                localStorage.setItem("currentfile", filename);
                displayLocalData();
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
            };
        }
    }

    //Method for displaying an new ag-grid using the current localstorage data
    function displayLocalData() {
        var csvData = JSON.parse(localStorage.getItem("displaydata"));
        var filename = localStorage.getItem("currentfile");
        $("#file-upload-container").append('<div id="clear-data" class="btn btn-danger">Clear Data</div>');
        document.getElementById('clear-data').addEventListener('click', clearData, false);
        $("#ag-grid-header").html('<h3>Upload Results for '+filename+'</h3>');
        removeOldAgGrid();
        addNewAgGrid(csvData);
    }

    //Method to clear the contents of the grid and its header
    function removeOldAgGrid() {
        $("#ag-grid").html('');
    }

    //Method to clear localStorage and the file upload value, remove the ag-Grid, and hide the clear data button
    function clearData() {
        localStorage.removeItem("displaydata");
        $("#txtFileUpload").val('');
        $("#clear-data").hide();
        $("#export").hide();
        $("#ag-grid-header").html('');
        removeOldAgGrid();
    }

    //Method to add an ag-Grid to the page
    function addNewAgGrid(data) {
        var columnDefs = [];
        var rowData = [];

        var createImageSpan = function(image) {
            var resultElement = document.createElement("span");
                var imageElement = document.createElement("img");
                imageElement.src = 'http://icons.iconarchive.com/icons/paomedia/small-n-flat/32/sign-check-icon.png';
                resultElement.appendChild(imageElement);
            return resultElement;
        };

        var daysSunshineRenderer = function(params) {
            var daysSunshine = params.value / 24;
            return createImageSpan(daysSunshine, params.rendererImage);
        };

        for (var i = 0; i < data[0].length; i++) {
            var header = data[0][i];
            columnDefs.push({
                headerName: header,
                field: header.toLowerCase(),
                editable: true,
                cellEditor: 'text'
            });
        }
        columnDefs.push({
            headerName: 'Picture',
            field: header.toLowerCase(),
            cellRenderer: daysSunshineRenderer,
            cellRendererParams: {
                rendererImage: 'http://eadb.org/wp-content/uploads/2015/08/profile-placeholder.jpg'
            }
        });
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
            enableSorting: true,
            rowHeight: 35
        };
        var onBtExport = function() {
            var exportParams = {
                fileName: document.querySelector('#txtFileUpload').value
            };
            gridOptions.api.exportDataAsCsv(exportParams);
        };
        //Add ag-Grid to the page with the defined grid options
        var eGridDiv = document.querySelector('#ag-grid');
        new agGrid.Grid(eGridDiv, gridOptions);
        //Add the row data to the grid
        gridOptions.api.setRowData(rowData);
        $("#ag-grid-header").append('<button id="export">Export to CSV</button>');
        document.getElementById('export').addEventListener('click', onBtExport, false);
    }

    if (localStorage.getItem("displaydata")) {
        displayLocalData();
    } else {
        $("#clear-data").hide();
        $("#export").hide();
    }
});