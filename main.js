/*
 main.js - An Atmel (TM) AVR (TM) simulator

 Copyright (C) 2015  Julian Ingram

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

function run_stop()
{
    if (window.avrjs.is_running() === true)
    {
        $("#btn_run").prop("value", "Run");
        window.avrjs.stop();
        $("#freq").html("Stopped");
    }
    else
    {
        $("#btn_run").prop("value", "Stop");
        window.avrjs.run();
        if (window.avrjs.is_asleep() === true)
        {
            $("#freq").html("Asleep");
        }
        else
        {
            $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
        }
    }
}

function disp_sleep_cb(s)
{
    if (s != 0)
    { // sleep
        $("#freq").html("Asleep");
    }
    else
    { // wake
        $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    }
}

// functions to pass though to html

function load()
{
    if ($("#bootsz").length && $("#bootrst").length)
    {
        window.avrjs.init(window.u0_term.write, disp_sleep_cb, $("#bootsz").val(), $("#bootrst").prop("checked") ? 1 : 0);
    }
    else
    {
        window.avrjs.init(window.u0_term.write, disp_sleep_cb);
    }
    $("#btn_run").prop("value", "Run");
    window.u0_term.clear();
    $("#freq").html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    window.avrjs.load_file(document.getElementById("bin_file"));
}

function main_resize()
{
    window.u0_term.resize($(window).width(), $(window).height() - ($("#nav_bar").outerHeight() + $("#footer").outerHeight()));
}

$(window).resize(function ()
{
    main_resize();
});

$(function()
{
    // avr
    window.avrjs = avrjs();

    // terminal
    var term_div = $("#u0_term");
    var nav_div = $("#nav_bar");
    var foot_div = $("#footer");
    window.u0_term = term(term_div, $(window).width(), $(window).height() - (nav_div.outerHeight() + foot_div.outerHeight()), 10, function (value)
    { // keypress
        if (window.avrjs.is_running() === true)
        {
            window.avrjs.uart0_write(value);
        }
    });
    term_div.focus();

    // frequency
    var freq_div = $("#freq");
    freq_div.html(window.avrjs.get_frequency().toFixed(2) + " MHz");
    interval = setInterval(function () // function called every 2s
    {
        if (window.avrjs.is_running() === false)
        {
            freq_div.html("Stopped");
        }
        else if (window.avrjs.is_asleep() === true)
        {
            freq_div.html("Asleep");
        }
        else
        {
            freq_div.html(window.avrjs.get_frequency().toFixed(2) + " MHz");
        }
    }, 2000);

    // load defaults only once
    if (window.defaults_loaded === 0)
    {
        load_default();
    }
    else
    {
        window.defaults_loaded = 0;
    }
});

var Module = {
    onRuntimeInitialized: function ()
    {
        // load defaults only once
        if (window.defaults_loaded === 0)
        {
            load_default();
        }
        else
        {
            window.defaults_loaded = 0;
        }
    }
};
