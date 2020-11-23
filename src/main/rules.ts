import { Severity } from './file-alert';
import { Metadata } from './metadata-scanner';
import { Rule } from './rule';

export class IncludesDescriptionRule extends Rule {
    protected severity = Severity.MODERATE;
    protected errorMessage = 'The metadata does not include a description';
    protected isViolated(metadata: Metadata): boolean {
        let isViolated = false;
        const desctiptionMatch = metadata.getRawContents().match(/<description>[^]*<\/description>/);
        if (!metadata.isManagedMetadata() && !desctiptionMatch) {
            isViolated = true;
        }
        return isViolated;
    }
}

// TODO Similar rule for IF(something, true, false)
export class IncludesEqualsBooleanRule extends Rule {
    protected severity = Severity.MINOR;
    protected errorMessage = 'The formula contains a comparison of a checkbox (boolean) to the keyword true or false, this is unnessisary as the boolean itself can be used';
    private surroundingText: string;

    public constructor(surroundingText?: string) {
        super();
        this.surroundingText = surroundingText || '<formula>{innerText}<\/formula>';
    }

    protected isViolated(metadata: Metadata): boolean {
        const equalsBooleanMatch = metadata.getRawContents().match(this.getRegexPattern());
        if (equalsBooleanMatch) {
            this.lineNumber = equalsBooleanMatch.index;
            this.violationLine = equalsBooleanMatch[1];
        }
        return !!equalsBooleanMatch;
    }

    private getRegexPattern(): RegExp {
        return new RegExp(this.surroundingText.replace('{innerText}', this.getEqualsText()), 'mi');
    }

    private getEqualsText(): string {
        return '([^]+=\\s*(false|true)[^]*)';
    }
}

// TODO could check for where the line is entered (ie it should sit at the top)
export class SkipAutomationRule extends Rule {
    protected severity = Severity.MODERATE;
    protected skipAutomation: string;
    protected errorMessage: string;
    public constructor(skipAutomation: string) {
        super();
        this.skipAutomation = skipAutomation;
        this.errorMessage = 'The file does not include the line ' + this.skipAutomation;
    }
    protected isViolated(metadata: Metadata): boolean {
        return !metadata.getRawContents().includes(this.skipAutomation);
    }
}

export class DeactivatedMetadataRule extends Rule {
    protected severity = Severity.MODERATE;
    protected activeFlag: string;
    protected errorMessage = 'Deactivated metadata should not be included in source control, please consider removing from the source';
    public constructor(activeFlag: string) {
        super();
        this.activeFlag = activeFlag;
    }
    protected isViolated(metadata: Metadata): boolean {
        return !metadata.getRawContents().includes(this.activeFlag);
    }
}

export class NamingConventionRule extends Rule {
    protected severity = Severity.HIGH;
    protected errorMessage = 'The name of the metadata object does not match the suggested convention';
    protected namingPattern: RegExp;

    public constructor(namingPattern: RegExp) {
        super();
        this.namingPattern = namingPattern;
    }
    protected isViolated(metadata: Metadata): boolean {
        const lastPathDeliiter = metadata.getPath().lastIndexOf('/') + 1;
        const startOfExtension = metadata.getPath().indexOf('.'); // Could strip based of the metadata file pattern
        const fileName = metadata.getPath().substring(lastPathDeliiter, startOfExtension);
        return !this.namingPattern.test(fileName);
    }
}

// TODO include rules for checking plain text passwords in named credentials
// TODO Naming convention rules
// TODO Add templates for creating new plugins and scanners using the https://github.com/jondot/hygen and npx (as in browserforce)
// TODO A feature for resolving issues that it can, eg boolean equalities can be fixed easily
