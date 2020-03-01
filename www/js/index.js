window.is_authenticated = false;
window.roles = [];

var menu_template = `
<div class="panel-group" role="tablist">
    <div class="panel panel-default">
{{#menu}}
      <div class="panel-heading" role="tab" id="header-{{id}}">
        <h4 class="panel-title">
          <a style="width:100%;" class="collapsed" role="button" data-toggle="collapse" href="#collapse-{{id}}">
          {{#icon}}<img class="icon" src="{{icon}}">&nbsp;{{/icon}}{{name}}
          </a>
        </h4>
      </div>
      <div id="collapse-{{id}}" class="panel-collapse collapse" role="tabpanel" style="height: 0px;">
        <ul class="list-group">
{{#children}}
          <li class="list-group-item">
          <a target="webview" href="{{url}}" class="menulink" data-everyone="{{everyone}}">
                {{^everyone}}<img class="icon pull-right" src="http://portalawsdev.binghamton.edu/assets/icons/fontawesome/white/36/lock.png">{{/everyone}}
                {{#icon}}<img class="icon" src="{{icon}}">&nbsp;{{/icon}}{{name}}
        </a>
          </li>
{{/children}}
          </ul>
      </div>
{{/menu}}
    </div>
</div>

{{#is_authenticated}}
    <div class="btn btn-danger logout">Logout</div>
{{/is_authenticated}}
{{^is_authenticated}}
    <div class="btn btn-danger login">Login</div>
{{/is_authenticated}}
`;

var attempt_authenticate = function(credentials) {
    $.ajax({
        type: "GET",
        url: "http://portalawsdev.binghamton.edu/ellucianmobile/login",
        async: false,
        beforeSend: function (xhr) {
            xhr.setRequestHeader ("Authorization", "Basic " + btoa(credentials.username + ":" + credentials.password));
        },    
        success: function(data){
            window.is_authenticated = true;
            alert('Welcome '+credentials.username);
            get_roles();
            change_view('menu');
            save_obj(credentials,'credentials');
        },
        error:function(data) {
            alert('Authentication Failed');
        }
    });
}

var configure_ss = function() {
    window.ss = new cordova.plugins.SecureStorage(
        function() {
            console.log("Success");
        },
        function(error) {
            console.log("Error " + error);
        },
        "bMobi"
    ); 
}

var save_obj = function(obj,name) {
    window.ss.set(
        function(key) {
            console.log("Set " + key);
        },
        function(error) {
            console.log("Error " + error);
        },
        name,
        JSON.stringify(obj)
    );    
}

var check_biometrics = function() {
    window.ss.get(
        function(value) {
            console.log("Success, got " + value);
            var credentials = JSON.parse(value)
            if (credentials.biometrics === true) {
                Fingerprint.show({
                    description: "Some biometric description"
                }, successCallback, errorCallback);
                function successCallback(){
                    attempt_authenticate(credentials);
                }
                function errorCallback(error){
                    alert("Authentication invalid " + error.message);
                }              
            }
        },
        function(error) {
            console.log("Error " + error);
        },
        "credentials"
    );
}

var filter_menu = function(menu) {
    if (window.is_authenticated) {
        menu = _.filter(menu, function(o) { var intersection = _.intersection(window.roles,o.access); return (o.access[0]==='Everyone' || intersection.length > 0) });
        for (var i=0;i<menu.length;i++) {
            menu[i].children = _.filter(menu[i].children, function(o) { var intersection = _.intersection(window.roles,o.access); return (o.access[0]==='Everyone' || intersection.length > 0) });
        }
    } else {
        menu = _.filter(menu, function(o) { return (o.hide==='false'); });
        for (var i=0;i<menu.length;i++) {
            menu[i].children = _.filter(menu[i].children, function(o) { return (o.hide==='false'); });
        }
    }
    return menu;
}

var build_menu = function() {
    if (typeof window.config !== 'undefined') {
        var menu = _.sortBy(window.config.mapp,function(o){return parseInt(o.order);});
        var myMenu = [];
        var current_index = 0;
        for (var i=0;i<menu.length;i++) {
            if (menu[i].type==='header') {
                current_index = myMenu.push({
                    id:current_index,
                    name:menu[i].name,
                    icon:menu[i].icon,
                    access:menu[i].access,
                    hide:menu[i].hideBeforeLogin,
                    children:[]
                })-1;
            } else {
                myMenu[current_index].children.push({
                    name:menu[i].name,
                    icon:menu[i].icon,
                    access:menu[i].access,
                    everyone:(menu[i].access[0]==='Everyone'),
                    hide:menu[i].hideBeforeLogin,
                    url:menu[i].urls.url
                });
            }
        }
        myMenu = filter_menu(myMenu);
        var menu_html = gform.m(menu_template,{'menu':myMenu,'is_authenticated':window.is_authenticated});
        $('.mainmenu').html(menu_html);
        $('.collapse').collapse();
    }
}

var change_view = function(view) {
    $('.webview').hide();
    $('.home_screen').hide();
    $('.mainmenu').hide();
    $('.menubutton').show();
    if (view==='webview') {
        $('.webview').show();
    } else if (view==='home') {
        $('.home_screen').show();
    } else if (view==='menu') {
        $('.mainmenu').show();
        $('.menubutton').hide();
    }
}

var get_roles = function() {
    $.getJSON('http://portalawsdev.binghamton.edu/ellucianmobile/userinfo',{},function(data) {
        window.roles = data.roles;
        build_menu();
    })
}

var build_login_form = function() {
    var myForm = new gform({
        fields: [
            {label: 'Username', name:'username'}, 
            {label: 'Password', name: 'password',type:'password'},
            {label: 'Use Biomterics', name: 'biometrics',type:'checkbox'},
        ],
        actions:[
            {"type":"save","label":"Submit","modifiers":"btn btn-primary"},
        ]
    },'.login-form');
    myForm.on('save',function(data) {
        var credentials = data.form.get();
        attempt_authenticate(credentials);
    })    
}

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        configure_ss();
        $.getJSON('http://portalawsdev.binghamton.edu/ellucianmobile/config',{},function(data) {
            window.config = data;
            build_menu();
        });
        check_biometrics();
        build_login_form()
        $('body').on('click','.mainmenu a.menulink',function(e) {
            e.preventDefault();
            var clickThis = this;
            if (window.is_authenticated) {
                $.getJSON('http://portalawsdev.binghamton.edu/ellucianmobile/checkauth',{},function(data) {
                    if (data.authenticated) {
                        $(".webviewiframe").attr("src", $(clickThis).attr("href"));
                        change_view('webview')
                    } else {
                        change_view('home')
                    }
                })
            } else {
                if ($(clickThis).data('everyone')) {
                    $(".webviewiframe").attr("src", $(clickThis).attr("href"));
                    change_view('webview')
                } else {
                    change_view('home')
                }
            }
        })
        $('body').on('click','.webviewiframe a',function(e) {
            e.preventDefault();
            debugger;
        });
        $('body').on('click','.menubutton',function(e) {
            change_view('menu')
        })
        $('body').on('click','.btn.logout',function(e) {
            $.ajax({type: "GET", url: "http://portalawsdev.binghamton.edu/logout", success:function() {
                change_view('menu')
                window.is_authenticated = false;
                build_menu();
            }});
        })
        $('body').on('click','.btn.login',function(e) {
            change_view('home')
        })
    },
};

app.initialize();
// app.onDeviceReady();// Comment This Out!

