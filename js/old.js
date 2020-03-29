function printTable(file, data) {
    // To build tables inside accordeon.

    // <div class="card">
    //   <div class="card-header" id="headingOne">
    //     <h2 class="mb-0">
    //       <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
    //         Collapsible Group Item #1
    //       </button>
    //     </h2>
    //   </div>
    //
    //   <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordionExample">
    //     <div class="card-body">
    //       Anim pariatur cliche reprehenderit, enim eiusmod high life accusamus terry richardson ad squid. 3 wolf moon officia aute, non cupidatat skateboard dolor brunch. Food truck quinoa nesciunt laborum eiusmod. Brunch 3 wolf moon tempor, sunt aliqua put a bird on it squid single-origin coffee nulla assumenda shoreditch et. Nihil anim keffiyeh helvetica, craft beer labore wes anderson cred nesciunt sapiente ea proident. Ad vegan excepteur butcher vice lomo. Leggings occaecat craft beer farm-to-table, raw denim aesthetic synth nesciunt you probably haven't heard of them accusamus labore sustainable VHS.
    //     </div>
    //   </div>
    // </div>
    var html = ''
    html += '<div class="card">'
    html += '<div class="card-header" id=\"h_' + file.name + '\">'
    html += '<h2 class="mb-0">'
    html += '<button class=\"btn btn-link\" type=\"button\" data-toggle=\"collapse\" data-target=\"#c_' + file.name + '\" aria-expanded=\"true\" aria-controls=\c_"' + file.name + '\">'
    html += file.name;
    html += '</button>'
    html += '</h2>';
    html += '</div>'
    html += '<div id=\"c_' + file.name + '\" class=\"collapse\" aria-labelledby=\"h_' + file.name + '\" data-parent=\"#imported_data\">'
    html += '<div class="card-body p-0">'
    html += '<table class=\"table table-responsive table-hover mb-0\">';
    html += '<thead>'
    data_row = data[0][0].split(";")
    html += '<tr>\r\n';
    for (var item in data_row) {
        html += '<th>' + data_row[item] + '</th>\r\n';
    }
    html += '</tr>\r\n';
    html += '</thead>'
    html += '<tbody>'
    for (var row = 1; row < data.length; row++) {
        data_row = data[row][0].split(";")
        html += '<tr>\r\n';
        for (var item in data_row) {
            html += '<td>' + data_row[item] + '</td>\r\n';
        }
        html += '</tr>\r\n';
    }
    html += '</tbody>'
    html += '</table>'
    html += '</div>'
    html += '</div>'
    html += '</div>'
    $('#imported_data').append(html);
}
