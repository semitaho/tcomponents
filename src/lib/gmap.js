import React from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
class Gmap extends React.Component {

  constructor() {
    super();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setOptions({draggable: false, suppressMarkers: true});
    this.markers = [];
    this.map = null;
  }

  render() {
    return (
      <div id={this.props.id} className={this.props.className}></div>
    );
  }

  renderMap(mapOptions) {
    if (this.map) {
      return;
    }
    let domNode = ReactDOM.findDOMNode(this);
    this.map = new google.maps.Map(domNode, mapOptions);
    if (this.props.onMapCreated) {
      this.props.onMapCreated(this.map);
    }
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (JSON.stringify(nextProps) !== JSON.stringify(this.props));
  }


  isEqual(newProp, oldProp) {
    return JSON.stringify(newProp) === JSON.stringify(oldProp);
  }

  componentWillReceiveProps(nextProps) {

    if (this.isEqual(nextProps, this.props)) {
      return;
    }

    if (nextProps.direction) {
      this.updateDirection(nextProps.direction);
    }

    if (nextProps.circle) {
      this.drawCircle(nextProps.circle, nextProps.radius);

    }
    if ( !this.isEqual(nextProps.center, this.props.center)) {
      this.updateCenter(nextProps);
      this.props.onCenterChanged();
    }
    if (nextProps.marker) {
      this.drawMarker(nextProps.marker);
    }
  }

  componentWillUnmount() {
    this.map = null;
    if (this.props.onMapDestroyed){
      this.props.onMapDestroyed();
    }

  }

  updateDirection(direction) {
    if (null === direction.end) {
      this.directionsRenderer.setMap(null);
      return;
    }
    let directionsService = new google.maps.DirectionsService();
    let request = {
      origin: direction.start,
      destination: direction.end,
      travelMode: google.maps.TravelMode.WALKING
    };
    directionsService.route(request, (direction, status) => {
      if (status == google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setMap(this.map);
        this.directionsRenderer.setDirections(direction);
      } else {
        this.directionsRenderer.setMap(null);
      }
    });

  }

  updateCenter(props) {
    this.map.setCenter(props.center);
  }

  drawCircle(position, radius) {
    if (this.cityCircle) {
      this.cityCircle.setMap(null);
    }
    this.cityCircle = new google.maps.Circle({
      strokeColor: '#FF0000',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#FF0000',
      fillOpacity: 0.35,
      map: this.map,
      center: {lat: position.lat, lng: position.lng},
      radius: radius,
      editable: true,
      draggable: true
    });

    if (this.props.radiuschanged) {
      this.cityCircle.addListener('radius_changed', _ => {
        this.props.radiuschanged(this.cityCircle.getRadius());

      });
    }
    return this.cityCircle;
  }

  drawMarker(position) {
    if (this.marker) {
      this.marker.setMap(null);
    }

    this.marker = new google.maps.Marker({
      position: position,
      map: this.map,
      animation: google.maps.Animation.DROP,
      title: 'Nykyinen sijainti'
    });
  }

  componentDidMount() {
    this.geocoder = new google.maps.Geocoder;

    var mapOptions = {
      draggable: true,
      scaleControl: false,
      zoomControl: true,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP,
        style: google.maps.ZoomControlStyle.LARGE
      },
      disableDefaultUI: true,
      scrollwheel: this.props.scrollwheel,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
      zoom: this.props.initialZoom
    };
    this.renderMap(mapOptions);


    const calcHeight = () => {
      let h = $(window).height();
      let mapElement = $('#' + this.props.id);
      let mapY = mapElement.offset().top;
      let footerHeight = $('#footer').height();
      $('#' + this.props.id).height(h - mapY - footerHeight - 10);
    };
    //  UIUtils.calculateModalMapHeight(this.props.id);


    if (this.props.radius && this.props.circle) {
      this.renderMap(mapOptions);
      this.drawCircle(this.props.circle, this.props.radius);
    }
    if (this.props.route) {
      this.createRoute(this.props.route);
    }

    if (this.props.center) {
      this.updateCenter((this.props));
    }

    if (this.props.marker) {
      this.drawMarker(this.props.marker);
    }
    if (this.props.onMapClick) {
      google.maps.event.addListener(this.map, 'click', this.props.onMapClick);
    }

    if (this.props.onClick) {
      google.maps.event.addListener(this.map, 'click', event => {
        this.props.onClick(event.latLng);
        this.createFindingMarker({lat: event.latLng.lat(), lng: event.latLng.lng()});
      });
    }

    if (this.props.onArea) {
      google.maps.event.addListener(this.map, 'click', event => {

      });
    }
  }

  updateArea(location) {
    if (this.marker) {
      this.marker.setMap(null);
    }
    this.marker = new google.maps.Marker({
      position: location,
      map: this.map,
      animation: google.maps.Animation.DROP,
      title: 'Nykyinen sijainti'
    });
    this.map.setCenter(this.marker.getPosition());
    return this.marker.position;
  }

  updateMarker(location) {
    if (this.marker) {
      this.marker.setMap(null);
    }
    var position = {lat: location.latitude, lng: location.longitude};
    this.marker = new google.maps.Marker({
      position: position,
      map: this.map,
    });
    this.map.setCenter(this.marker.getPosition());
    return this.marker.position;
  }

  createFindingMarker(latlng) {
    var markerIcon = {
      scale: 7,
      animation: google.maps.Animation.DROP,
      path: google.maps.SymbolPath.CIRCLE
    };

    if (this.findingMarker) {
      this.findingMarker.setMap(null);
    }

    this.findingMarker = new google.maps.Marker({
      draggable: false,
      icon: markerIcon,
      position: {
        lat: latlng.lat,
        lng: latlng.lng
      },
      map: this.map
    });
  }

  createKadonneet() {
    var infowindow = new google.maps.InfoWindow();

    this.props.kadonneet.forEach(finding => {
        var markerIcon = {
          scale: 7,
          path: google.maps.SymbolPath.CIRCLE
        };
        var coordinates = ItemUtils.findKatoamispaikkaLoc(finding);
        var marker = new google.maps.Marker({
          draggable: false,
          icon: markerIcon,
          position: {
            lat: coordinates.lat,
            lng: coordinates.lng
          },
          map: this.map
        });
        let content = '<div> ' +
          '   <div>' +
          '    <h4>' + finding.name + ' <small>Kadonnut 13.11.2015</small></h4>' +
          '    ' +
          '   </div>' +
          '     <div class="clearfix content-heading">' +
          '     <img class="img-havainto img-span pull-left" src="' + finding.imgsrc + '" />' +
          '     <p>' + finding.description + '</p>' +
          '   </div>' +
          '   <footer><a href="/kadonneet/' + finding._id + '">Avaa profiili</a></footer> '
        ' </div>';
        marker.addListener('click', e => {
          this.map.setCenter({lat: coordinates.lat, lng: coordinates.lng});
          infowindow.close();
          infowindow.setContent(content)
          infowindow.open(this.map, marker);
        });

      }
    )
  }

  createMarkers(findings) {
    var self = this;

    var cross = {
      path: 'M 0,0 0,-8 0,0 -6,0 6,0 0,0 0,15 z',
      fillColor: 'yellow',
      fillOpacity: 0.8,
      scale: 1,
      strokeColor: 'black',
      strokeWeight: 3
    };

    findings.forEach(finding => {
        var markerIcon = null;
        switch (finding.type) {
          case 3:
            markerIcon = cross;
            break;
          default:
            markerIcon = {
              scale: 7,
              path: google.maps.SymbolPath.CIRCLE
            };
        }

        var marker = new google.maps.Marker({
          draggable: false,
          icon: markerIcon,
          position: {
            lat: finding.lat,
            lng: finding.lng
          },
          map: self.map
        });

        var infowindow = new google.maps.InfoWindow({
          content: self.generateInfowindowContent(finding)
        });
        marker.addListener('click', e => {
          self.map.setCenter({lat: finding.lat, lng: finding.lng});
          infowindow.open(self.map, marker);
        });

      }
    )
  }

  createRoute(latlngs) {

    if (this.line) {
      this.line.setMap(null);
    }
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
    };

    this.line = new google.maps.Polyline({
      path: latlngs,
      strokeOpacity: '0.5',
      icons: [{
        icon: lineSymbol,
        offset: '95%'
      }],
      map: this.map
    });
  }

  convertTimestampToTime(timestamp) {
    var dt = new Date(timestamp);
    var year = dt.getFullYear();
    var month = dt.getMonth() + 1;
    var day = dt.getDate();
    var hours = dt.getHours();
    var minutes = dt.getMinutes();
    return day + '.' + month + '.' + year + " klo " + hours + ":" + minutes;

  }

  generateInfowindowContent(finding) {
    var str = '<div class="thumbnail">';
    if (finding.imgsrc) {
      str += '    <a target="_blank" href="' + finding.imgsrc + '"><img class="img-havainto" src="' + finding.imgsrc + '" /></a>';
    }
    str += '<div class="caption"><h5>' + finding.description + '</h5><p>' + this.convertTimestampToTime(finding.timestamp) + '</p></div>';
    str += '</div>';
    return str;
  }

}

Gmap.propTypes = {id: React.PropTypes.string.isRequired};
Gmap.defaultProps = {className: '', scrollwheel: false, initialZoom: 12};
export default Gmap;
