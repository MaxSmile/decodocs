import React from 'react';
import SectionHeader from './SectionHeader.jsx';
import { ImOnedrive } from "react-icons/im";
import {
    SiGoogledrive,
    SiDropbox,
    SiBox,
    SiHubspot,
    SiIcloud
} from "react-icons/si";

const integrations = [
    { name: 'Google Drive', icon: SiGoogledrive, color: '#4285F4' },
    { name: 'Dropbox', icon: SiDropbox, color: '#0061FE' },
    { name: 'OneDrive', icon: ImOnedrive, color: '#0078D4' },
    { name: 'iCloud', icon: SiIcloud, color: '#3693F3' },
    { name: 'Box', icon: SiBox, color: '#0061D5' },
    { name: 'HubSpot', icon: SiHubspot, color: '#FF7A59' },
];

const Integrations = () => {
    return (
        <section className="px-6 py-24 bg-white">
            <div className="mx-auto w-full max-w-6xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="flex-1 space-y-8">
                        <SectionHeader
                            eyebrow="Integrations"
                            title="Connects with your workflow in one click"
                            description="DecoDocs integrates seamlessly with the tools you already use. Analyze documents directly from your cloud storage or email."
                            align="left"
                        />

                        <div className="flex flex-col gap-4">
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs text-bold">✓</span>
                                Works with all file types
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs text-bold">✓</span>
                                Secure OAuth connection
                            </div>
                            <div className="flex items-center gap-3 text-slate-700 font-medium">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 text-xs text-bold">✓</span>
                                No file duplication
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                            {integrations.map((tool) => (
                                <div key={tool.name} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm w-32 h-32 hover:shadow-md transition-shadow group">
                                    <tool.icon
                                        size={40}
                                        color={tool.color}
                                        className="mb-3 transition-transform group-hover:scale-110"
                                    />
                                    <span className="text-xs font-semibold text-slate-600">{tool.name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Integrations;
