(function() {

    jstorrent.Peer = Backbone.Model.extend({
        className: 'Peer',
        initialize: function(opts) {
            this.torrent = opts.torrent;
            this._last_closed = null;
            this._unresponsive = null;
            this._banned = false;
            this._ever_connected = null; // whether this peer ever did anything useful...
        },
        repr: function() {
            return this.id;
        },
        ban: function() {
            this._banned = true;
            // ban this peer.
        },
        notify_closed: function(data, conn) {
            if (! data._remote_handshake) {
                // never even gave me a handshake!
                this._unresponsive = true;
            }
            mylog(LOGMASK.peer, this.repr(),'peer closed',data, data.reason);
            this._last_closed = new Date();

            if (data.reason == 'dpoint closed') {
                this._reconnect_in = new Date() + 1000;
            } else if (data.reason == 'dpoint timeout') {
                this._reconnect_in = new Date() + 5000;
            }
        },
        is_self: function() {
            return false;
        },
        can_reconnect: function() {
            if (this.torrent.get('complete') == 1000 && this.get('complete')) {
                return false;
            } else if (this._banned) { 
                return false;
            } else if (! this._last_closed) {
                return true;
            } else if (this._unresponsive && this.collection.length > 10) {
                // never even handshook
                return false;
            } else if (this._reconnect_in && new Date() > this._reconnect_in) {
                this._reconnect_in = null;
                return true;
            } else {
                return new Date() - this._last_closed > 5 * 1000;
            }
        }
    });

})();
