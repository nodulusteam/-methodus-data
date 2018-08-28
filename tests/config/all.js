'use strict';

module.exports = {
    reports: { threshold: 1024, providers: ['@tmla-tiles/alert/reports/'] },


    app: {
        title: 'TMLA',
        description: 'AT&T Threat Manager: Log Analysis',
        keywords: 'AT&T Threat Manager: Log Analysis',
        clientAppName: 'setaApp'
    },
    port: 3030,
    templateEngine: 'ejs',
    sessionSecret: 'RETHINKDB',
    rethinkDB: {
        arrayLimit: 500000
    },
    case_status: {
        new: 'new',
        investigation: 'investigation',
        closed_resolved: 'closed resolved',
        closed_unresolved: 'closed unresolved'
    },
    reconfigure: {
        shards: 1,
        replicas: {
            'default': 3
        },
        primaryReplicaTag: 'default'
    },
    logs: [{
        name: 'general',
        directory: 'logs',
        level: 'debug', // { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
        handleExceptions: true,
        json: false,
        fileName: 'frontend_logfile.log',
        maxsize: 5242880,
        maxFiles: 5,
        colorize: true
    }],
    utilities: {
        pdfTemplates: {
            alert: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/alertsSummary.html',
            case: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/caseSummary.html',

            event_by_type: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-event-type.html',
            event_by_device_class: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-device-class.html',
            event_by_source_ip: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-source-ip.html',
            event_by_user: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-user.html',
            event_by_hostname: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-hostname.html',
            event_by_destination_ip: '/opt/app/seta/seta-client/node_modules/@tmla/reports/resources/pdf-report-templates/events/events-by-destination-ip.html',

            att_logo_uri: 'file:///opt/app/seta/seta-client/public/images/att-logo.png',
            customer_logo_uri: 'file:///opt/app/seta/seta-client/public/images/companylogo/'
        }
    },
    downloads:
    {
        path: './csv-downloads/',
        filenameprefix: 'data'
    }
};
