/**execute when the DOM is fully loaded*/
$(function() {

    // configure typeahead
    $("#q").typeahead({
        highlight: false,
        minLength: 2
    },
    {
        display: function(suggestion) { return null; },
        limit: 10,
        source: search,
        templates: {
            suggestion: Handlebars.compile(
                "<div>" +
                "{{name}} {{debut}}" +
                "</div>"
            )}
    });

    // link to baseball-reference data after player is selected from drop-down
    $("#q").on("typeahead:selected", function(eventObject, suggestion, name){

        // cache: false;
        $.getJSON('http://lookup-service-prod.mlb.com/json/named.sport_career_hitting.bam?league_list_id=%27mlb%27&' +
        'game_type=%27R%27&player_id=' + suggestion.id, function(data){

            var ply = data.sport_career_hitting.queryResults.row;

            /*starting the first row of the table*/
            var tablename = '<table><tr>';
            var table = '<table><tr>'
            /*the first header shows the name of the player*/
            tablename += '<th>' + suggestion.name + '</th>';
            /*add the header for eab*/
            tablename += '<th>eab:<th>';

            /* loop over each key in the array to change the name of some keys*/
            for ( var key in ply ){
                if ( key == "tpa") { ply.pa = ply.tpa; delete ply.tpa;}
                else if ( key == "sac") { ply.sh = ply.sac; delete ply.sac;}
                else if ( key == "t") { ply.b3 = ply.t; delete ply.t;}
                else if ( key == "d") { ply.b2 = ply.d; delete ply.d;}
            }

            var eab = (Number(ply['tb']) + Number(ply['hbp']) - Number(ply['gidp']) + Number(ply['sh']) + Number(ply['sf']) +
            Number(ply['sb']) - Number(ply['cs']) + Number(ply['rbi']) - Number(ply['hr'])) / (Number(ply['pa'])*4);

            tablename += '<th style="font-size: 20px; color: rgb(255,0,0)">' + Math.round(eab*1000) + '<th></tr></table>';


            for ( key in ply){
                if ( key == "hr" || key == "gidp" || key == "sh" || key == "rbi" || key == "lob" || key == "tb" ||
                key == "bb" || key == "avg" || key == "slg" || key == "ops" || key == "hbp" || key == "b2" || key == "so" ||
                key == "sf" || key == "pa" || key == "h" || key == "cs" || key == "obp" || key == "b3" || key == "r" ||
                key == "sb" || key == "ab" || key == "ibb" || key == "roe"){
                    /* add to html string started above*/
                    table += '<th>' + key + '</th>';
                    }
            }

            /*finish the first row, start a new one*/
            table += '</tr><tr>';

            /* loop over each value in the array to create another row of values*/
            for ( key in ply ){
                if ( key == "hr" || key == "gidp" || key == "sh" || key == "rbi" || key == "lob" || key == "tb" ||
                key == "bb" || key == "avg" || key == "slg" || key == "ops" || key == "hbp" || key == "b2" || key == "so" ||
                key == "sf" || key == "pa" || key == "h" || key == "cs" || key == "obp" || key == "b3" || key == "r" ||
                key == "sb" || key == "ab" || key == "ibb" || key == "roe"){
                /* add to html string started above*/
                table += '<td>' + ply[key] + '</td>';
                }
            }

            table += '</tr></table>';

            /*create two divs and one break line between the two*/
            $('.ply').html('<div class="ply" id="plyrn"></div>');
            $('#plyrn').after('<div class="ply" id="lnbrk"></div>');
            $('#lnbrk').after('<div class="ply" id="plyr"></div>');

            /* insert the html string*/
            $('#plyrn').html(tablename);
            $('#plyr').html(table);
        });
    });

        // give focus to text box
        $("#q").focus();
});

/** Searches database for typeahead's suggestions.*/
function search(query, syncResults, asyncResults)
{
    // get players matching query (asynchronously)
    var player_json = 'http://lookup-service-prod.mlb.com/json/named.search_player_all.bam?sport_code=%27mlb%27&name_part=%27'
    + encodeURI(query) + '%25%27';

    $.getJSON(player_json)
    .done(function(data, textStatus, jqXHR) {

        var row = data.search_player_all.queryResults.row;
        var row_length = data.search_player_all.queryResults.totalSize;
        var player_s = [];

        try {
            if ( row_length > 1){ /* if there is more than one row would be an array, otherwise it would be a string */
                for (var i = 0; i < row_length; i++){
                    if ( row[i].position != 'P') { /* if the player is not a pitcher */
                        var one_player = { /* create an object with these three properties */
                            name: row[i].name_display_first_last,
                            debut: row[i].pro_debut_date.substring(0,10),
                            id: row[i].player_id
                        };
                        player_s.push(one_player); /* push the new object into the array */
                    }
                }
            } else if ( row_length == 1) {
                if ( row.position != 'P') {
                    one_player = {
                        name: row.name_display_first_last,
                        debut: row.pro_debut_date.substring(0,10),
                        id: row.player_id
                    };
                    player_s.push(one_player);
                }
            } else { throw "No such player name, search again please"}
        }
        catch (err) {
            one_player = {
                name: err
            };
            player_s.push(one_player);
        }

        //call typeahead's callback with search results ( player's name and last name & player's debut & id)
        asyncResults(player_s);

    })

    .fail(function(jqXHR, textStatus, errorThrown) {

        // log error to browser's console
        console.log(errorThrown.toString());

        // call typeahead's callback with no results
        asyncResults([]);
    });
}
