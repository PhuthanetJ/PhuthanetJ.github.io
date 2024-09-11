function ajax(opts) {
	$.ajax({
		url: opts.url,
		type: opts.type,
		cache: false,
		headers: {
			'csrf-token': window.$csrf
		},
		contentType: 'application/json;charset=utf-8',
		dataType: 'json',
		data: JSON.stringify(opts.data),
		success(rs) {
			if (typeof opts.success === 'function') {
				opts.success(rs)
			}
		},
		error(jqXHR, status) {
			if (status === 'parsererror') {//invalid json response
				console.log('parse ajax error')
			}
			if (typeof opts.error === 'function') {
				const json = jqXHR.responseJSON
				opts.error(json ? (json || jqXHR.statusText) : jqXHR.responseText, status)
			}
		},
		complete(jqXHR, status) {
			if (typeof opts.complete === 'function') {
				opts.complete(jqXHR, status)
			}
		}
	})
}
function noErr() {
	$('.mt_err').hide();
	$('.err_div').hide();
}

function go_freetrail() {
	noErr();
	$('.login_div').hide();
	$('.freetrail_div').show();
}

function toLogin() {
	noErr();
	$('.account_div').hide();
	$('.login_div').show();
}
function toAccount(user, pass) {
	noErr();
	$('#account_user').val(user);
	$('#account_pass').val(pass);
	$('.freetrail_div').hide();
	$('.account_div').show();
}

function goTerm() {
	noErr();
	$('.freetrail_div').hide();
	$('.term_div').show();
}
function backTerm() {
	noErr();
	$('.term_div').hide();
	$('.freetrail_div').show();
	$('#check_term').prop('checked', true);
	$('#do_freetrail_btn').prop('disabled', false);
}
function error(text) {
	$('.err_div').text(text).show();
}

function freetrail(path) {
	var fullname = $('#fullname').val();
	var email = $('#email').val();
	var mobile = $('#mobile').val();
	if ((fullname && fullname.length > 2)
		|| (email && email.length > 4)
		|| (mobile && mobile.length >= 10)) {
		ajax({
			url: 'http://110.78.191.36/portal/mt/' + path + '/freetrial',
			type: 'POST',
			data: {
				fullname: fullname,
				email: email,
				mobile: mobile
			},
			success: function (rs) {
				document.sendin.pfx.value = rs.pfx || null;
				document.login.username.value = rs.username;
				document.login.password.value = rs.password;
				toAccount(rs.username, rs.password);
			},
			error: function (err) {
				error(err);
			},
			complete: function () {
			},
		})
	} else {
		error('Please enter all fields');
	}
}