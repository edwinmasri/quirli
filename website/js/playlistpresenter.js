/*! 
    quirli, replay with ease.
    Copyright (C) 2012-2018 by marcel suter, marcel@codeministry.ch

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*!
 * playlist presenter
 * This presents data on the tightly coupled view (the playlist.html file)
 * It uses known identifiers from the view to access and present various data.
 */

//visually initialize the page, including tooltips
$(document).ready(function () {
    $("#loadingdisplay").hide(); //to signal working javascript to the user
    $("#coreui").show(); //to signal working javascript to the user		
    $("[rel=tooltip]").tooltip();
    $("#progressdisplay").hide(); //document is ready now
});
