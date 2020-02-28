var menu_template = `
<div class="links">
    {{#menu}}
        <a target="webview" href="{{urls.url}}" class="btn btn-primary">{{name}}</a><br>
    {{/menu}}
</div>
<div class="btn btn-danger logout">Logout</div>
`;

var build_menu = function() {
    $.getJSON('http://portalawsdev.binghamton.edu/ellucianmobile/config',{},function(data) {
        var menu = _.filter(data.mapp, {"type":"web","hideBeforeLogin":"false"});
        var menu_html = gform.m(menu_template,{'menu':menu});
        $('.mainmenu').html(menu_html);
    });
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

var manage_login = function() {
    var myForm = new gform({
        fields: [
            {label: 'Username', name:'username'}, 
            {label: 'Password', name: 'password',type:'password'},
        ],
        actions:[
            {"type":"save","label":"Submit","modifiers":"btn btn-primary"},
        ]
    },'.login-form');
    myForm.on('save',function(data) {
        var credentials = data.form.get();
        // alert(credentials.username);
        $.ajax({
            type: "GET",
            url: "http://portalawsdev.binghamton.edu/ellucianmobile/login",
            async: false,
            beforeSend: function (xhr) {
                xhr.setRequestHeader ("Authorization", "Basic " + btoa(credentials.username + ":" + credentials.password));
            },    
            success: function(data){
                alert('Welcome '+credentials.username);
                change_view('menu');
            },
            error:function(data) {
                alert('Authentication Failed');
            }
        });
    
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
        build_menu();
        manage_login()
        $('body').on('click','.mainmenu a',function(e) {
            e.preventDefault();
            var clickThis = this;
            $.getJSON('http://portalawsdev.binghamton.edu/ellucianmobile/checkauth',{},function(data) {
                if (data.authenticated) {
                    $(".webviewiframe").attr("src", $(clickThis).attr("href"));
                    change_view('webview')
                } else {
                    change_view('home')
                }
            })
        })
        $('body').on('click','.menubutton',function(e) {
            change_view('menu')
        })
        $('body').on('click','.btn.logout',function(e) {
            $.ajax({type: "GET", url: "http://portalawsdev.binghamton.edu/logout", async: false});
            change_view('home')
        })
    },
};

app.initialize();
// app.onDeviceReady();// Comment This Out!

