document.addEventListener('DOMContentLoaded', (event) => {
    const dropdowns = document.querySelectorAll('.custom-dropdown-toggle');
    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function () {
            const menu = this.nextElementSibling;
            if (menu.style.display === "block") {
                menu.style.display = "none";
            } else {
                closeAllDropdowns();
                menu.style.display = "block";
            }
        });
    });

    document.addEventListener('click', function (event) {
        if (!event.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });

    function closeAllDropdowns() {
        const menus = document.querySelectorAll('.custom-dropdown-menu');
        menus.forEach(menu => {
            menu.style.display = "none";
        });
    }

    window.filterFunction1 = function (event) {
        event.stopPropagation();
        filterFunctionGeneric('dropdownSearch1', 'languageDropdownMenu');
    };

    window.filterFunction2 = function (event) {
        event.stopPropagation();
        filterFunctionGeneric('dropdownSearch2', 'titleDropdownMenu');
    };

    window.filterFunction3 = function (event) {
        event.stopPropagation();
        filterFunctionGeneric('dropdownSearch3', 'genderDropdownMenu');
    };

    window.filterFunction4 = function (event) {
        event.stopPropagation();
        filterFunctionGeneric('dropdownSearch4', 'provinceDropdownMenu');
    };

    function filterFunctionGeneric(searchId, menuId) {
        var input, filter, a, i;
        input = document.getElementById(searchId);
        filter = input.value.toUpperCase();
        div = document.getElementById(menuId);
        a = div.getElementsByTagName("a");
        for (i = 0; i < a.length; i++) {
            txtValue = a[i].textContent || a[i].innerText;
            if (txtValue.toUpperCase().indexOf(filter) > -1) {
                a[i].style.display = "";
            } else {
                a[i].style.display = "none";
            }
        }
    }

    const normalDropdownItems = document.querySelectorAll('.custom-dropdown-menu a:not(.language-dropdown .dropdown-item)');
    normalDropdownItems.forEach(item => {
        item.addEventListener('click', function(event) {
            if (!this.classList.contains('disabled')) {
                event.preventDefault();
                const dropdownButton = this.closest('.custom-dropdown').querySelector('.custom-dropdown-toggle');
                dropdownButton.innerHTML = this.innerHTML.trim() + `<span class="dropdown-arrow">&#9662;</span>`;
                closeAllDropdowns();
            }
        });
    });

    const languageDropdownItems = document.querySelectorAll('.language-dropdown .dropdown-item');
    languageDropdownItems.forEach(item => {
        item.addEventListener('click', function(event) {
            if (!this.classList.contains('disabled')) {
                event.preventDefault();
                const dropdownButton = this.closest('.custom-dropdown').querySelector('.custom-dropdown-toggle');
                const flag = this.getAttribute('data-flag');
                const value = this.getAttribute('data-value');
                dropdownButton.innerHTML = `<img class="mr-2" src="${flag}" alt="${value} Flag" width="20" height="15"> ${value} <span class="dropdown-arrow">&#9662;</span>`;
                closeAllDropdowns();
                updateInputsLanguage(value);
            }
        });
    });

    function updateInputsLanguage(language) {
        const languages = {
            'ไทย': {
                username: 'ชื่อผู้ใช้',
                password: 'รหัสผ่าน',
                fullName: 'ชื่อ - นามสกุล',
                idNumber: 'เลขประจำตัวประชาชน 13 หลัก',
                passportNumber: 'เลขหนังสือเดินทาง',
                birthDate: 'วันเกิด',
                email: 'อีเมล์',
                phone: 'เบอร์มือถือ',
                otp: 'หมายเลข OTP',
                titleDropdown: 'คำนำหน้าชื่อ',
                genderDropdown: 'เพศ',
                provinceDropdown: 'จังหวัด'
            },
            'English': {
                username: 'Username',
                password: 'Password',
                fullName: 'Full Name',
                idNumber: 'ID Number (13 digits)',
                passportNumber: 'Passport Number',
                birthDate: 'Birth Date',
                email: 'Email',
                phone: 'Phone Number',
                otp: 'OTP',
                titleDropdown: 'Title',
                genderDropdown: 'Gender',
                provinceDropdown: 'Province'
            },
            '日本語': {
                username: 'ユーザー名',
                password: 'パスワード',
                fullName: '氏名',
                idNumber: 'ID番号（13桁）',
                passportNumber: 'パスポート番号',
                birthDate: '生年月日',
                email: 'メール',
                phone: '電話番号',
                otp: 'OTP',
                titleDropdown: '敬称',
                genderDropdown: '性別',
                provinceDropdown: '州'
            },
            '한국어': {
                username: '사용자 이름',
                password: '비밀번호',
                fullName: '성명',
                idNumber: 'ID 번호 (13자리)',
                passportNumber: '여권 번호',
                birthDate: '생년월일',
                email: '이메일',
                phone: '전화번호',
                otp: 'OTP',
                titleDropdown: '호칭',
                genderDropdown: '성별',
                provinceDropdown: '도'
            },
            '中国的': {
                username: '用户名',
                password: '密码',
                fullName: '姓名',
                idNumber: '身份证号（13位）',
                passportNumber: '护照号码',
                birthDate: '出生日期',
                email: '电子邮件',
                phone: '电话号码',
                otp: 'OTP',
                titleDropdown: '称谓',
                genderDropdown: '性别',
                provinceDropdown: '省'
            }
        };

        const elements = [
            { id: 'username', key: 'username' },
            { id: 'password', key: 'password' },
            { id: 'full-name', key: 'fullName' },
            { id: 'id-number', key: 'idNumber' },
            { id: 'passport-number', key: 'passportNumber' },
            { id: 'birth-date', key: 'birthDate' },
            { id: 'email', key: 'email' },
            { id: 'phone', key: 'phone' },
            { id: 'otp', key: 'otp' },
            { id: 'titleDropdown', key: 'titleDropdown', type: 'dropdown' },
            { id: 'genderDropdown', key: 'genderDropdown', type: 'dropdown' },
            { id: 'provinceDropdown', key: 'provinceDropdown', type: 'dropdown' }
        ];

        if (languages[language]) {
            elements.forEach(({ id, key, type }) => {
                const element = document.getElementById(id);
                if (element) {
                    if (type === 'dropdown') {
                        element.innerHTML = `${languages[language][key]} <span class="dropdown-arrow">&#9662;</span>`;
                    } else {
                        element.placeholder = languages[language][key];
                    }
                }
            });
        }
    }
    
});
