import { describe, expect, it } from "vitest";
import { lerAtribuicao, origemDaVisita, rotuloDaOrigem } from "./atribuicao";

describe("origem da visita", () => {
  it("marcador utm manda; sem ele, usa o site de referência; sem nada, direto", () => {
    expect(origemDaVisita("?utm_source=Instagram&utm_medium=social&utm_campaign=play-lancamento", "", "somoskambada.com.br", "/kambadaplay/experimente?x=1")).toEqual({
      fonte: "instagram", meio: "social", campanha: "play-lancamento", entrada: "/kambadaplay/experimente",
    });
    expect(origemDaVisita("", "https://www.google.com/search?q=kambada", "somoskambada.com.br", "/")).toMatchObject({ fonte: "google.com", meio: "organico" });
    expect(origemDaVisita("", "https://l.instagram.com/", "somoskambada.com.br", "/loja")).toMatchObject({ fonte: "l.instagram.com", meio: "referral" });
    expect(origemDaVisita("", "", "somoskambada.com.br", "/")).toMatchObject({ fonte: "direto" });
    expect(origemDaVisita("", "https://somoskambada.com.br/loja", "somoskambada.com.br", "/sobre")).toBeNull();
  });

  it("valida o que vem do navegador e monta o rótulo", () => {
    const a = lerAtribuicao({ fonte: "<script>x</script>", meio: "social", campanha: "a".repeat(200), entrada: "/loja?a=1", extra: 1 })!;
    expect(a.fonte).toBe("scriptx/script");
    expect(a.campanha).toHaveLength(60);
    expect(a.entrada).toBe("/loja");
    expect(lerAtribuicao("x")).toBeUndefined();
    expect(lerAtribuicao({ entrada: "http://mau.com" })).toBeUndefined();
    expect(rotuloDaOrigem({ fonte: "instagram", meio: "social" })).toBe("instagram / social");
    expect(rotuloDaOrigem(undefined)).toBe("sem registro");
  });
});
