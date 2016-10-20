$( document ).ready(function() {

    var eGridDiv = document.querySelector('#ag-grid');

    // The event listener for the file upload
    document.getElementById('txtFileUpload').addEventListener('change', upload, false);

    // Method that checks that the browser supports the HTML5 File API
    function browserSupportFileUpload() {
        var isCompatible = false;
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            isCompatible = true;
        }
        return isCompatible;
    }

    function addAgGrid(data) {

        $("#ag-grid-header").append('<h3>Upload Results</h3>');

        var columnDefs = [];
        var rowData = [];

        for (var i = 0; i < data[0].length; i++) {
            var header = data[0][i];
            columnDefs.push({
                headerName: header,
                field: header.toLowerCase()
            });
        }

        for (var i = 1; i < data.length; i++) {
            var rowObject = {};

            for (var j = 0; j < data[i].length; j++) {
                var rowObjectKey = data[0][j];
                rowObject[rowObjectKey] = data[i][j];
            }
            rowData.push(rowObject);
        }

        var gridOptions = {
            columnDefs: columnDefs,
            rowData: rowData
        };

        var eGridDiv = document.querySelector('#ag-grid');
        new agGrid.Grid(eGridDiv, gridOptions);
    }

    // Method that reads and processes the selected file
    function upload(evt) {
        if (!browserSupportFileUpload()) {
            alert('The File APIs are not fully supported in this browser!');
        } else {
            var data = null;
            var file = evt.target.files[0];
            var reader = new FileReader();
            reader.readAsText(file);

            reader.onload = function(event) {
                var csvData = event.target.result;
                data = $.csv.toArrays(csvData);

                addAgGrid(data);

                // //Append Results Header
                // $("#results").append('<h3>CSV Data by Row</h3><table id="data-table"></table>');
                // //Loop over each row
                // for (var i = 0; i < data.length; i++) {
                //     $("#data-table").append('<tr class="data-row data-row-'+i+'"></tr>');
                //     for (var j = 0; j < data[i].length; j++) {
                //         $(".data-row:last").append('<td class="data-cell data-cell-' + j + '">' + data[i][j] + '</td>');
                //     }
                // }
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
            };
        }
    }

});