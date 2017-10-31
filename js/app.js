var map;

function initMap() {
    // Constructor creates a new map - only center and zoom are required.
    map = new google.maps.Map(document.getElementById('map'), {
        center: {
            lat: 44.651070,
            lng: -63.569062
        },
        zoom: 13,
        mapTypeControl: false
    });
    //View model creation and binding
    var viewM = new ViewModel();
    ko.applyBindings(viewM);
    
}


//myLoc is the location object that the viewM will use
var myLoc = function(data) {
    var self = this;
    self.title = data.title;
    self.location = data.location;
    self.id = data.id;
    self.contentFormat = '<div><h4>' + self.title + '</h4></div>' + '<div>Phone: dummyPhone</div><div>Address: dummyAddress</div>';
    self.unfiltered = ko.observable(true);

};

var ViewModel = function() {

    var self = this;
    var infowindow = new google.maps.InfoWindow({
        maxWidth: 250
    });
    bounds = new google.maps.LatLngBounds();
    var venue;
    var marker;
    var phone;
    var address;
    var id;

    // observable array containing original data
    self.locationList = ko.observableArray([]);

    // loop converting model to the observable array
    locations.forEach(function(data) {
        self.locationList.push(new myLoc(data));
    });

    self.locationList().forEach(function(data) {

        // create markers
        marker = new google.maps.Marker({
            position: data.location,
            map: map,
            animation: google.maps.Animation.DROP
        });
        bounds.extend(marker.position);
        data.marker = marker;

        // ajax call to FourSquare
        $.ajax({
            url: 'https://api.foursquare.com/v2/venues/search',
            dataType: 'json',
            data: 'limit=1' + '&ll=' + data.location.lat + ',' + data.location.lng + '&query=' + data.title +
                '&client_id=LAFJGBNDSOGOWYQ2IARETFA5JO3RM24M1V3L1BB5UWZDRRZU' +
                '&client_secret=NNZNZGUEXICUYF0DLTYBDR405SQAXEXV3XL5OM5VSVCIAAVE&v=20170801',
            async: true,

            // if the call is completed successfully, the success function will pull the information we want to display and format it for HTML.
            success: function(data) {
                // get the venues from response
                venue = data.response.hasOwnProperty("venues") ? data.response.venues[0] : '';
                id = venue.id;
                var vName, vPhone, vAddress;
                vName = venue.hasOwnProperty("name") ? venue.name : 'Unnamed Place';
                vPhone = venue.contact.hasOwnProperty("formattedPhone") ? venue.contact.formattedPhone : 'No contact phone available';
                vAddress = venue.location.hasOwnProperty("address") ? venue.location.address : 'No Provided address';
                // loop over the locations to set the correct content format with fourSquare data
                for (var i = 0; i < self.locationList().length; i++) {

                    if (self.locationList()[i].id == id) {
                        self.locationList()[i].contentFormat = self.locationList()[i].contentFormat.replace(/dummyName/g, vName).replace(/dummyPhone/g, vPhone).replace(/dummyAddress/g, vAddress);

                    }
                }

            },

            // on error
            error: function(e) {
                //infowindow.setContent('<p>Could not reach the FourSquare service, please try again later</p>');
                for (var i = 0; i < self.locationList().length; i++) {

                    if (self.locationList()[i].id == id) {
                        self.locationList()[i].contentFormat = "<p>Could not reach the FourSquare service, please try again later</p>" ;
                    }
                }
            self.errorMessage(e.statusText + " on FourSquare api call");
            }
        });


        // info windows on marker click
        google.maps.event.addListener(data.marker, 'click', function() {

            infowindow.open(map, this);
            data.marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function() {
                data.marker.setAnimation(null);
            }, 1200);

            infowindow.setContent(data.contentFormat);
        });


    });

    map.fitBounds(bounds);

    // info window and marker bounce on side list click
    self.chooseMarker = function(data) {
        google.maps.event.trigger(data.marker, 'click');
        data.marker.setAnimation(google.maps.Animation.BOUNCE);
    };

    // ko observable for the filter input
    self.selectedLocation = ko.observable();

    // filtering function will depend on setting the map as null for the unselected locations and hiding them based on the unfiltered property 
    self.filterMarker = function() {
        self.locationList().forEach(function(data) {

            if (self.selectedLocation() === '') {
                data.marker.setMap(map);
                data.unfiltered(true);


            } else {
                if (self.selectedLocation() == data.title) {
                    data.marker.setMap(map);
                    data.unfiltered(true);
                    google.maps.event.trigger(data.marker, 'click');
                } else {
                    data.marker.setMap(null);
                    data.unfiltered(false);
                }
            }
            map.fitBounds(bounds);
        });
    };

self.errorMessage = function (source) {
        if (source =='Google Maps'){
        $('#map').prepend(source);}
        else
        console.log(source);
    };



};//viewModel

$("#menu-toggle").click(function(e) {
            e.preventDefault();
            $(".options-box").toggleClass("toggled");
            $("#map").toggleClass("toggled");
        });