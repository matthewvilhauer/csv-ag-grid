$( document ).ready(function() {

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
                //Append Results Header
                $("#results").append('<h3>CSV Data by Row</h3><table id="data-table"></table>');
                for (var i = 0; i < data.length; i++) {
                    var rowLength = data[i].length;
                    $("#data-table").append('<tr class="data-row data-row-'+i+'">'+data[i]+'</tr>');
                    for (var j = 0; j < rowLength; j++) {
                        $(".data-row:last").append('<td class="data-cell data-cell-' + j + '">' + data[i][j] + '</td>');
                    }
                }
                console.log("**********Data*********", data);
            };
            reader.onerror = function() {
                alert('Unable to read ' + file.fileName);
            };
        }
    }
});