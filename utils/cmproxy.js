/**
 * This is a CloudMedia proxy which provides interface to front-end web applications
 * for communicating with the remote CloudMedia server.
 */

function CMUser(account, password) {
    console.log('CMUser');
    this.account = account;
    this.password = password;
    var _role = '';
    var _token = '';
    var _node_id = '';
    var _vendor_id = '';
    var _vendor_nick = '';
    var _group_id = '';
    var _group_nick = '';

    this.set_user_info = function(user_info) {
        var obj = user_info;
        _role = obj.role;
        _token = obj.token;
        _node_id = obj.node_id;
        _vendor_id = obj.vendor_id;
        _vendor_nick = obj.vendor_nick;
        _group_id = obj.group_id;
        _group_nick = obj.group_nick;
    }

    this.print_user_info = function() {
        console.log('UserInfo: role:' + _role + ',token:' + _token + ',nid:' + _node_id + ',vid:' + _vendor_id + ',vnick:' + _vendor_nick + ',gid:' + _group_id + ',gnick:' + _group_nick);
    }

    this.get_role = function() {
        return _role;
    }

    this.get_token = function() {
        return _token;
    }

    this.get_node_id = function() {
        return _node_id;
    }

    this.get_vendor_id = function() {
        return _vendor_id;
    }

    this.get_vendor_nick = function() {
        return _vendor_nick;
    }

    this.get_group_id = function() {
        return _group_id;
    }

    this.get_group_nick = function() {
        return _group_nick;
    }

}

function CMProxy(pubkey=null) {
    console.log('CMProxy');
    this.ws = null;
    this.serial = 0;
    this.waiting_replies = {};
    this.sent_requests = {};
    this.my_info = null;
    this.on_nodeslist_change = null;
    this.on_stream_exception = null;
    this.on_server_reset = null;
    this.cm_user = null;
    this.onopen = null;
    this.onclose = null;
    this.onerror = null;

    this._encrypt = null;
    if(pubkey != null) {
        this._encrypt = new JSEncrypt();
        this._encrypt.setPublicKey(pubkey);
    }

    this._onmessage = (evt)=>{
        console.log('onmessage:' + evt.data + ', type:' + typeof(evt.data));

        var jstring = JSON.parse(evt.data.toString())

        if('id' in jstring) {
            this._handle_reply(jstring);
        } else if ('action' in jstring) {
            this._handle_notify(jstring);
        } else {
            console.log('unknown message');
        }
    }

    this._onopen = ()=> {
        console.log('_onopen');
        if(this.onopen != null)
            this.onopen();
    }

    this._onclose = ()=> {
        console.log('_onclose');
        if(this.onclose != null)
            this.onclose();
    }

    this._onerror = (error)=> {
        console.log('_onerror');
        if(this.onerror != null)
            this.onerror(error);
    }

}

CMProxy.prototype.open = function(host) {
    var ws_addr = "wss://" + host + "/wss"
    this.ws = wx.connectSocket({
      url: ws_addr,
    })

    wx.onSocketOpen(this._onopen)
    wx.onSocketClose(this._onclose)
    wx.onSocketError(this._onerror)
    wx.onSocketMessage(this._onmessage)
}

CMProxy.prototype.close = function() {
    if (this.ws != null) {
        wx.closeSocket({
        })
        this.ws = null;
    }
}



CMProxy.prototype.login = function(account, password, listener) {
  
    this.cm_user = new CMUser(account, password);
    var method = 'Login';
    var params = {"account":account, "password":password};
    this._send_request(method, params, listener);
}

CMProxy.prototype.logout = function(account, listener) {
    var method = 'Logout';
    var params = {"account":account}
    this._send_request(method, params, listener);
    this.cm_user = null;
}

CMProxy.prototype.set_onopen = function(foo) {
    console.log('set onopen');
    this.onopen = foo;
    //this.ws.onpen = foo
}

CMProxy.prototype.set_onclose = function(foo) {
    console.log('set onclose');
    this.onclose = foo;
    //this.ws.onclose = foo
}

CMProxy.prototype.set_onerror = function(foo) {
    console.log('set onerror');
    this.onerror = foo;
    //this.ws.onerror = foo
}

CMProxy.prototype.set_nodeslist_change_listener = function(listener) {
    this.on_nodeslist_change = listener;
}

CMProxy.prototype.set_stream_exception_listener = function(listener) {
    this.on_stream_exception = listener;
}

CMProxy.prototype.set_server_reset_listener = function(listener) {
    this.on_server_reset = listener;
}

CMProxy.prototype.connect = function(nick, device_name, location, listener) {
    if (this.cm_user == null) {
        listener('{\"error\":\"ERROR: please login first\"}');
        return;
    }
    if (this.cm_user.get_role() != "puller") {
        listener('{\"error\":\"ERROR: role is not matched\"}');
        return;
    }
    var method = 'Online';
    var node_info = {};
    node_info.id = this.cm_user.get_node_id();
    node_info.nick = nick;
    node_info.role = this.cm_user.get_role();
    node_info.token = this.cm_user.get_token();
    node_info.device_name = this.cm_user.device_name;
    node_info.location = location;
    node_info.stream_status = "pulling_close";
    node_info.vendor_id = this.cm_user.get_vendor_id();
    node_info.vendor_nick = this.cm_user.get_vendor_nick();
    node_info.group_id = this.cm_user.get_group_id();
    node_info.group_nick = this.cm_user.get_group_nick();
    var params = node_info;
    this._send_request(method, params, listener);
    this.my_info = node_info;
}

CMProxy.prototype.disconnect = function(listener) {
    var method = 'Offline'
    this._send_request(method, null, listener);
    this.my_info = null;
}

CMProxy.prototype.getMyInfo = function() {
    if (this.my_info == null)
        return '';

    return JSON.stringify(this.my_info);
}

CMProxy.prototype.update_nick = function(new_nick, listener) {
    _update_cm_field("nick", new_nick, listener);
}

CMProxy.prototype.update_location = function(new_location, listener) {
    _update_cm_field("location", new_location, listener);
}

// stream_status: "pushing", "pushing_close", "pushing_error", "pulling", "pulling_close", "pulling_error"
CMProxy.prototype.update_stream_status = function(new_status, listener) {
    _update_cm_field("stream_status", new_status, listener);
}

CMProxy.prototype.start_push_media = function(target_id, target_gid, expire_time, listener) {
    var method = 'StartPushMedia';
    var target_tag = this.my_info.vendor_id + '_' + target_gid + '_' + target_id;
    var params = {"target-id":target_tag, "expire-time":expire_time};
    this._send_request(method, params, listener);
}

CMProxy.prototype.stop_push_media = function(target_id, target_gid, listener) {
    var method = 'StopPushMedia';
    var target_tag = this.my_info.vendor_id + '_' + target_gid + '_' + target_id;
    var params = {};
    params["target-id"] = target_tag;
    this._send_request(method, params, listener);
}

CMProxy.prototype._send_request = function(method, params, listener) {
  var request = {};
  request.jsonrpc = "2.0";
  request.method = method;
  if (params != null)
    request.params = params;
  // request.id must be a string for server required
  request.id = this.serial + "";
  var req_str = JSON.stringify(request);
  console.log(req_str)

  if (this._encrypt != null) {
    req_str = this._encrypt.encrypt(req_str);
  }
  this.ws.send({
    data: req_str
  })
  this.waiting_replies[this.serial] = listener
  console.log('add listener to waiting replies')
  console.log(this.waiting_replies)
  this.sent_requests[this.serial] = method
  console.log('add method to sent requests')
  console.log(this.sent_requests)

  ++this.serial;
}

CMProxy.prototype._handle_reply = function(jrpc){
    var id = jrpc["id"];
    var listener = this.waiting_replies[id];
    if (listener == null) {
        console.log('unknown reply?');
        return;
    }

    var request = this.sent_requests[id];
    if ('error' in jrpc) {
        var text = '{\"error\":' + JSON.stringify(jrpc["error"]) + '}';
        listener(text);
        if (request == 'Online') {
            console.log('online failed, clear this.my_info');
            this.my_info = null;
        }
    } else if ('result' in jrpc) {
        if(id in this.waiting_replies) {
            console.log('id is found in waiting replies');
            var result = jrpc["result"];
            switch(request) {
            case 'Login':
                this.cm_user.set_user_info(result);
                this.cm_user.print_user_info();
            case 'StartPushMedia':

            default:
                var text = '{\"result\":' + JSON.stringify(jrpc["result"]) + '}';
                listener(text);
                break;
            }
        }
    } else {
        console.log('unknown waiting replies for id:' + id);
    }

    delete this.waiting_replies[id];
    delete this.sent_requests[id];
}

CMProxy.prototype._handle_notify = function(jstr) {
    var action = jstr["action"];
    var payload = jstr["payload"];
    switch(action) {
    case 'nodes_change':
        if (this.on_nodeslist_change != null)
            this.on_nodeslist_change(JSON.stringify(payload));
        break;
    case 'stream_exception':
        if (this.on_stream_exception != null)
            this.on_stream_exception(JSON.stringify(payload));
        break;
    case 'reset':
        if (this.on_server_reset != null)
            this.on_server_reset(JSON.stringify(payload));
        break;
    default:
        break;
    }
}

CMProxy.prototype._update_cm_field = function(field, new_value, listener) {
    var method = 'UpdateField';
    var params = {"field":field, "value":new_value};
    this._send_request(method, params, listener);
}

module.exports = {
  CMProxy: CMProxy,
  login: CMProxy.prototype.login,
  logout: CMProxy.prototype.logout,
  open: CMProxy.prototype.open,
  close: CMProxy.prototype.close,
  set_onopen: CMProxy.prototype.set_onopen,
  set_onclose: CMProxy.prototype.set_onclose,
  set_onerror: CMProxy.prototype.set_onerror,
  set_nodeslist_change_listener: CMProxy.prototype.set_nodeslist_change_listener,
  connect: CMProxy.prototype.connect,
  disconnect: CMProxy.prototype.disconnect,
  start_push_media: CMProxy.prototype.start_push_media,
  stop_push_media: CMProxy.prototype.stop_push_media,
}