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
    var term_div = document.getElementById("u0_term");
    term_div.style.height = ($(window).height() - ($("#nav_bar").outerHeight() + $("#footer").outerHeight()) - 12) + "px";
    window.u0_term.reflow();
}

$(window).resize(function ()
{
    main_resize();
});

const TERM_CONFIG = {
    "width": "calc(100% - 12px)",
    "height": "",
    "font-size": "0.9rem",
    "padding": "6px",
    "tabindex": 0
}

$(function()
{
    // avr
    window.avrjs = avrjs();

    // terminal
    var term_div = document.getElementById("u0_term");
    var nav_div = $("#nav_bar");
    var foot_div = $("#footer");
    window.u0_term = term(term_div, function (value)
    { // keypress
        if (window.avrjs.is_running() === true)
        {
            window.avrjs.uart0_write(value);
        }
    });
    window.u0_term.config(TERM_CONFIG);
    term_div.focus();

    main_resize();

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
