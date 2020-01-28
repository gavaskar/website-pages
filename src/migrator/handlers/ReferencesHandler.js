// @flow
import type {CheerioDocType, CheerioElemType, ConversionResultType} from "./BaseHandler";
import BaseHandler from "./BaseHandler";
import { extractHeadingText, extractLinkText, isElementAHeadingNode, assert } from "./Utils";

const assertExtractedData = (items, title, $e) => assert(items.length > 0 && items.every((item) => item.link && item.title) && Boolean(title), "ReferencesHandler-CannotExtractReferences", $e);

export class ReferencesHandlerVariant_Nav extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return $element.get(0).tagName == "nav";
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const $element = elements[0];
        const title = extractHeadingText($element.find("h2,h3,h4,h5,h6,h7").eq(0), $);
        const items = $element.find("li > a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, $element);
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_HeadingRegex extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        const allowedNextTagNames = ["table"];
        const headingRegex = /related [a-z]* product/i;
        return isElementAHeadingNode($element) && $element.text().match(headingRegex) && allowedNextTagNames.includes($element.next().get(0).tagName);
    }

    walkToPullRelatedElements($element: CheerioElemType, $: CheerioDocType): Array<CheerioElemType> {
        return [$element, $element.next()];
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = extractHeadingText(elements[0], $);
        const items = elements[1].find("a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        return {elements: [{type: "references", title, items}]};
    }
}

export class ReferencesHandlerVariant_InterlinksOfAccordion extends BaseHandler {
    isCapableOfProcessingElement($element: CheerioElemType) {
        return $element.hasClass("product-interlinks") && $element.find(".twi-accordion").length > 0;
    }

    convert(elements: Array<CheerioElemType>, $: CheerioDocType): ConversionResultType {
        const title = elements[0].find(".panel-heading a").text();
        const items = elements[0].find(".panel-body a").map((i, link) => ({link: $(link).attr("href"), title: extractLinkText($(link), $)})).get();
        assertExtractedData(items, title, elements[0]);
        return {elements: [{type: "references", title, items}]};
    }
}